from django.db.models import Max, Q
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from .serializers import ConversationListSerializer, MessageSerializer
from .models import Conversation, Message
from .presence import build_presence_payload


class ConversationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("user_id")

        if not other_user_id:
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        other_user = get_object_or_404(User, id=other_user_id)

        if other_user == request.user:
            return Response(
                {"detail": "You cannot start a conversation with yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation = Conversation.objects.filter(
            Q(participant1=request.user, participant2=other_user)
            | Q(participant1=other_user, participant2=request.user)
        ).first()

        created = conversation is None
        if created:
            conversation = Conversation.objects.create(
                participant1=request.user, participant2=other_user
            )

        return Response(
            {"conversation_id": conversation.id, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        conversations = (
            Conversation.objects.filter(
                Q(participant1=request.user) | Q(participant2=request.user)
            )
            .select_related("participant1", "participant1__presence", "participant2", "participant2__presence")
            .prefetch_related("messages")
            .annotate(last_message_at=Max("messages__timestamp"))
            .order_by("-last_message_at", "-created_at")
        )

        serializer = ConversationListSerializer(
            conversations, many=True, context={"request": request}
        )

        return Response(serializer.data)


class ConversationClearView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.filter(
                Q(participant1=request.user) | Q(participant2=request.user)
            ),
            id=conversation_id,
        )

        messages = Message.objects.filter(conversation=conversation)
        for message in messages:
            if message.attachment:
                message.attachment.delete(save=False)
        messages.delete()

        return Response(
            {"message": "Conversation cleared successfully."},
            status=status.HTTP_200_OK,
        )


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_conversation(self, request, conversation_id):
        queryset = Conversation.objects.filter(
            Q(participant1=request.user) | Q(participant2=request.user)
        )
        return get_object_or_404(queryset, id=conversation_id)

    def get(self, request, conversation_id):
        conversation = self.get_conversation(request, conversation_id)

        messages = Message.objects.filter(conversation=conversation).order_by(
            "timestamp"
        )

        messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)

        serializer = MessageSerializer(messages, many=True)

        return Response(serializer.data)

    def post(self, request, conversation_id):
        conversation = self.get_conversation(request, conversation_id)
        serializer = MessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save(conversation=conversation, sender=request.user)
        self.broadcast_message(request, conversation, message)
        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def broadcast_message(self, request, conversation, message):
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        message_payload = MessageSerializer(
            message,
            context={"request": request},
        ).data

        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation.id}",
            {
                "type": "chat.message",
                "payload": {
                    "type": "message.new",
                    "client_id": message.client_id,
                    "message": message_payload,
                },
            },
        )

        for participant in (conversation.participant1, conversation.participant2):
            async_to_sync(channel_layer.group_send)(
                f"notifications_user_{participant.id}",
                {
                    "type": "inbox.event",
                    "payload": {
                        "type": "conversation.message",
                        "conversation": self.build_conversation_payload(
                            conversation=conversation,
                            viewer=participant,
                            message=message,
                        ),
                        "message": message_payload,
                    },
                },
            )

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
