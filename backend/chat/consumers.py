import asyncio
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .attachments import build_attachment_payload
from .models import Conversation, Message, UserPresence
from .presence import (
    HEARTBEAT_INTERVAL_SECONDS,
    build_presence_payload,
    is_user_online,
    reconcile_stale_presence,
)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        self.group_name = f"notifications_user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        self.heartbeat_task = asyncio.create_task(self.heartbeat_loop())
        presence_event = await self.mark_user_online()
        if presence_event:
            await self.broadcast_presence_to_contacts(presence_event)

    async def disconnect(self, close_code):
        if hasattr(self, "heartbeat_task"):
            self.heartbeat_task.cancel()
            try:
                await self.heartbeat_task
            except asyncio.CancelledError:
                pass

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

        if getattr(self, "user", None) and self.user.is_authenticated:
            presence_event = await self.mark_user_offline()
            if presence_event:
                await self.broadcast_presence_to_contacts(presence_event)

    async def heartbeat_loop(self):
        try:
            while True:
                await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
                await self.touch_presence()
        except asyncio.CancelledError:
            pass

    async def inbox_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def broadcast_presence_to_contacts(self, presence_event):
        contact_ids = await self.get_contact_ids()
        for contact_id in contact_ids:
            await self.channel_layer.group_send(
                f"notifications_user_{contact_id}",
                {
                    "type": "inbox.event",
                    "payload": {
                        "type": "presence.update",
                        **presence_event,
                    },
                },
            )

    @database_sync_to_async
    def touch_presence(self):
        UserPresence.objects.filter(user=self.user, is_online=True).update(
            updated_at=timezone.now()
        )

    @database_sync_to_async
    def mark_user_online(self):
        with transaction.atomic():
            presence, _ = UserPresence.objects.select_for_update().get_or_create(
                user=self.user
            )
            was_actively_online = is_user_online(presence)
            stale_fields = [
                "connection_count",
                "is_online",
                "last_seen",
                "updated_at",
            ]
            if reconcile_stale_presence(presence):
                presence.save(update_fields=stale_fields)
                was_actively_online = False

            presence.connection_count += 1
            presence.is_online = True
            presence.save(update_fields=["connection_count", "is_online", "updated_at"])

        if was_actively_online:
            return None

        return {
            "user_id": self.user.id,
            "username": self.user.username,
            "is_online": True,
            "status": "online",
            "last_seen": presence.last_seen.isoformat() if presence.last_seen else None,
        }

    @database_sync_to_async
    def mark_user_offline(self):
        with transaction.atomic():
            presence, _ = UserPresence.objects.select_for_update().get_or_create(
                user=self.user
            )
            stale_fields = [
                "connection_count",
                "is_online",
                "last_seen",
                "updated_at",
            ]
            if reconcile_stale_presence(presence):
                presence.save(update_fields=stale_fields)
                return None

            if presence.connection_count > 0:
                presence.connection_count -= 1

            if presence.connection_count > 0:
                presence.save(update_fields=["connection_count", "updated_at"])
                return None

            was_online = presence.is_online
            presence.is_online = False
            presence.connection_count = 0
            presence.last_seen = timezone.now()
            presence.save(
                update_fields=[
                    "connection_count",
                    "is_online",
                    "last_seen",
                    "updated_at",
                ]
            )

        if not was_online:
            return None

        return {
            "user_id": self.user.id,
            "username": self.user.username,
            "is_online": False,
            "status": "offline",
            "last_seen": presence.last_seen.isoformat(),
        }

    @database_sync_to_async
    def get_contact_ids(self):
        contact_ids = set()
        conversations = Conversation.objects.filter(
            Q(participant1=self.user) | Q(participant2=self.user)
        ).values_list("participant1_id", "participant2_id")

        for participant1_id, participant2_id in conversations:
            other_id = participant2_id if participant1_id == self.user.id else participant1_id
            contact_ids.add(other_id)

        return list(contact_ids)


class ChatConsumer(AsyncWebsocketConsumer):
    MAX_MESSAGE_LENGTH = 5000

    async def connect(self):
        self.user = self.scope.get("user")
        self.conversation_id = int(self.scope["url_route"]["kwargs"]["conversation_id"])
        self.room_group_name = f"chat_{self.conversation_id}"

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        if not await self.user_can_access_conversation():
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if not hasattr(self, "room_group_name"):
            return

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error("invalid_payload", "Payload must be valid JSON.")
            return

        event_type = payload.get("type")
        if event_type == "message.send":
            await self.handle_message(payload)
        elif event_type in {"typing.start", "typing.stop", "typing_start", "typing_stop"}:
            await self.handle_typing(event_type)
        elif event_type == "message.read":
            await self.handle_read_receipt()
        else:
            await self.send_error("unsupported_event", "Unsupported WebSocket event type.")

    async def handle_message(self, payload):
        content = str(payload.get("content", "")).strip()
        client_id = payload.get("client_id")

        if not content:
            await self.send_error("empty_message", "Message content cannot be empty.", client_id)
            return
        if len(content) > self.MAX_MESSAGE_LENGTH:
            await self.send_error(
                "message_too_long",
                f"Messages cannot exceed {self.MAX_MESSAGE_LENGTH} characters.",
                client_id,
            )
            return

        try:
            message, notifications = await self.create_message(content, client_id)
        except ObjectDoesNotExist:
            await self.send_error("conversation_not_found", "Conversation is unavailable.", client_id)
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "payload": {
                    "type": "message.new",
                    "client_id": client_id,
                    "message": message,
                },
            },
        )

        for notification in notifications:
            await self.channel_layer.group_send(
                f"notifications_user_{notification['user_id']}",
                {
                    "type": "inbox.event",
                    "payload": {
                        "type": "conversation.message",
                        "conversation": notification["conversation"],
                        "message": message,
                    },
                },
            )

    async def handle_typing(self, event_type):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "typing.indicator",
                "payload": {
                    "type": "typing.update",
                    "sender_id": self.user.id,
                    "username": self.user.username,
                    "is_typing": event_type in {"typing.start", "typing_start"},
                },
            },
        )

    async def handle_read_receipt(self):
        message_ids = await self.mark_messages_read()
        if not message_ids:
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "read.receipt",
                "payload": {
                    "type": "messages.read",
                    "username": self.user.username,
                    "message_ids": message_ids,
                },
            },
        )

    async def chat_message(self, event):
        await self.send_json(event["payload"])

    async def typing_indicator(self, event):
        if event["payload"].get("sender_id") == self.user.id:
            return

        payload = dict(event["payload"])
        payload.pop("sender_id", None)
        await self.send_json(payload)

    async def presence_update(self, event):
        await self.send_json(event["payload"])

    async def read_receipt(self, event):
        await self.send_json(event["payload"])

    async def send_json(self, payload):
        await self.send(text_data=json.dumps(payload))

    async def send_error(self, code, message, client_id=None):
        await self.send_json(
            {
                "type": "error",
                "code": code,
                "message": message,
                "client_id": client_id,
            }
        )

    @database_sync_to_async
    def user_can_access_conversation(self):
        return Conversation.objects.filter(
            id=self.conversation_id,
            participant1=self.user,
        ).exists() or Conversation.objects.filter(
            id=self.conversation_id,
            participant2=self.user,
        ).exists()

    @database_sync_to_async
    def create_message(self, content, client_id):
        conversation = Conversation.objects.select_related(
            "participant1",
            "participant1__presence",
            "participant2",
            "participant2__presence",
        ).get(id=self.conversation_id)
        if client_id:
            client_id = str(client_id)[:64]
            message, _ = Message.objects.get_or_create(
                conversation=conversation,
                sender=self.user,
                client_id=client_id,
                defaults={"content": content},
            )
        else:
            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                content=content,
            )
        message_payload = {
            "id": message.id,
            "client_id": message.client_id,
            "sender": self.user.username,
            "content": message.content,
            "attachment": build_attachment_payload(message),
            "timestamp": message.timestamp.isoformat(),
            "is_read": message.is_read,
        }
        notifications = [
            {
                "user_id": participant.id,
                "conversation": self.build_conversation_payload(
                    conversation=conversation,
                    viewer=participant,
                    message=message,
                ),
            }
            for participant in (conversation.participant1, conversation.participant2)
        ]
        return message_payload, notifications

    def build_conversation_payload(self, conversation, viewer, message):
        other_user = (
            conversation.participant2
            if conversation.participant1_id == viewer.id
            else conversation.participant1
        )
        unread_count = (
            Message.objects.filter(conversation=conversation, is_read=False)
            .exclude(sender=viewer)
            .count()
        )
        last_message = message.content
        if not last_message and message.attachment:
            last_message = message.attachment_name or message.attachment_category.title()

        return {
            "id": conversation.id,
            "user_id": other_user.id,
            "username": other_user.username,
            "last_message": last_message,
            "timestamp": message.timestamp.isoformat(),
            "unread_count": unread_count,
            "is_online": build_presence_payload(getattr(other_user, "presence", None))[0],
            "last_seen": (
                other_user.presence.last_seen.isoformat()
                if getattr(other_user, "presence", None)
                and other_user.presence.last_seen
                else None
            ),
        }

    @database_sync_to_async
    def mark_messages_read(self):
        messages = Message.objects.filter(
            conversation_id=self.conversation_id,
            is_read=False,
        ).exclude(sender=self.user)
        message_ids = list(messages.values_list("id", flat=True))
        if message_ids:
            messages.update(is_read=True)
        return message_ids
