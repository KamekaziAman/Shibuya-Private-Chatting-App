import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Conversation, Message


TEST_MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class ChatApiTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="testpass123")
        self.bob = User.objects.create_user(username="bob", password="testpass123")
        self.charlie = User.objects.create_user(username="charlie", password="testpass123")
        self.conversation = Conversation.objects.create(
            participant1=self.alice,
            participant2=self.bob,
        )
        self.client.force_authenticate(self.alice)

    def test_create_or_open_conversation_is_idempotent(self):
        response = self.client.post("/api/conversations/", {"user_id": self.bob.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["conversation_id"], self.conversation.id)
        self.assertFalse(response.data["created"])

    def test_send_and_fetch_message(self):
        send_response = self.client.post(
            f"/api/messages/{self.conversation.id}/",
            {"content": "  Hello Bob  "},
        )

        self.assertEqual(send_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(send_response.data["content"], "Hello Bob")
        self.assertEqual(send_response.data["sender"], "alice")

        list_response = self.client.get(f"/api/messages/{self.conversation.id}/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)

    def test_blank_message_is_rejected(self):
        response = self.client.post(
            f"/api/messages/{self.conversation.id}/",
            {"content": "   "},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Message.objects.count(), 0)

    def test_non_participant_cannot_access_messages(self):
        self.client.force_authenticate(self.charlie)
        response = self.client.get(f"/api/messages/{self.conversation.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_conversation_list_contains_summary(self):
        Message.objects.create(
            conversation=self.conversation,
            sender=self.bob,
            content="Latest update",
        )

        response = self.client.get("/api/conversations/list/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["username"], "bob")
        self.assertEqual(response.data[0]["last_message"], "Latest update")
        self.assertEqual(response.data[0]["unread_count"], 1)

    def test_participant_can_clear_conversation_messages(self):
        Message.objects.create(
            conversation=self.conversation,
            sender=self.alice,
            content="First message",
        )
        Message.objects.create(
            conversation=self.conversation,
            sender=self.bob,
            content="Second message",
        )

        response = self.client.delete(
            f"/api/conversations/{self.conversation.id}/clear/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["message"],
            "Conversation cleared successfully.",
        )
        self.assertTrue(Conversation.objects.filter(id=self.conversation.id).exists())
        self.assertFalse(Message.objects.filter(conversation=self.conversation).exists())

    def test_non_participant_cannot_clear_conversation_messages(self):
        Message.objects.create(
            conversation=self.conversation,
            sender=self.alice,
            content="Private message",
        )

        self.client.force_authenticate(self.charlie)
        response = self.client.delete(
            f"/api/conversations/{self.conversation.id}/clear/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Message.objects.filter(conversation=self.conversation).exists())

    def test_upload_attachment_creates_message_metadata(self):
        upload = SimpleUploadedFile(
            "sample.png",
            b"tiny-image",
            content_type="image/png",
        )

        response = self.client.post(
            f"/api/messages/{self.conversation.id}/",
            {"attachment_file": upload, "content": "Screenshot"},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "Screenshot")
        self.assertEqual(response.data["attachment"]["name"], "sample.png")
        self.assertEqual(response.data["attachment"]["category"], "image")
        self.assertEqual(response.data["attachment"]["type"], "image/png")
        self.assertEqual(Message.objects.count(), 1)

    def test_upload_attachment_larger_than_five_mb_is_rejected(self):
        upload = SimpleUploadedFile(
            "large.zip",
            b"x" * (5 * 1024 * 1024 + 1),
            content_type="application/zip",
        )

        response = self.client.post(
            f"/api/messages/{self.conversation.id}/",
            {"attachment_file": upload},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Message.objects.count(), 0)

    def test_stale_presence_is_reported_offline_in_conversation_list(self):
        from datetime import timedelta

        from django.utils import timezone

        from .models import UserPresence
        from .presence import PRESENCE_STALE_SECONDS

        presence = UserPresence.objects.create(
            user=self.bob,
            is_online=True,
            connection_count=1,
        )
        UserPresence.objects.filter(pk=presence.pk).update(
            updated_at=timezone.now() - timedelta(seconds=PRESENCE_STALE_SECONDS + 30),
        )

        response = self.client.get("/api/conversations/list/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bob_conversation = next(item for item in response.data if item["username"] == "bob")
        self.assertFalse(bob_conversation["is_online"])

