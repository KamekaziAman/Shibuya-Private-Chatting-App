from django.db import models
from django.contrib.auth.models import User
from pathlib import Path
from uuid import uuid4


def chat_attachment_upload_to(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"chat/attachments/{instance.conversation_id}/{uuid4().hex}{extension}"


class Conversation(models.Model):
    participant1 = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="conversation_as_participant1"
    )

    participant2 = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="conversation_as_participant2"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.participant1.username} - {self.participant2.username}"


class Message(models.Model):
    ATTACHMENT_IMAGE = "image"
    ATTACHMENT_VIDEO = "video"
    ATTACHMENT_FILE = "file"
    ATTACHMENT_CATEGORY_CHOICES = [
        (ATTACHMENT_IMAGE, "Image"),
        (ATTACHMENT_VIDEO, "Video"),
        (ATTACHMENT_FILE, "File"),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )

    sender = models.ForeignKey(User, on_delete=models.CASCADE)

    client_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)

    content = models.TextField(blank=True)

    attachment = models.FileField(
        upload_to=chat_attachment_upload_to,
        null=True,
        blank=True,
    )

    attachment_name = models.CharField(max_length=255, blank=True)

    attachment_size = models.PositiveIntegerField(null=True, blank=True)

    attachment_type = models.CharField(max_length=120, blank=True)

    attachment_category = models.CharField(
        max_length=12,
        choices=ATTACHMENT_CATEGORY_CHOICES,
        blank=True,
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    is_read = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "sender", "client_id"],
                name="unique_message_client_id_per_sender",
            )
        ]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}"


class UserPresence(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="presence",
    )

    is_online = models.BooleanField(default=False)

    connection_count = models.PositiveIntegerField(default=0)

    last_seen = models.DateTimeField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}: {'online' if self.is_online else 'offline'}"
