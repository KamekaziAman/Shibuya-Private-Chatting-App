from pathlib import Path

from django.conf import settings
from rest_framework import serializers

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS
MAX_ATTACHMENT_SIZE = getattr(settings, "MAX_CHAT_ATTACHMENT_SIZE", 5 * 1024 * 1024)


def get_attachment_category(file):
    extension = Path(file.name).suffix.lower()
    content_type = getattr(file, "content_type", "") or ""

    if extension in IMAGE_EXTENSIONS or content_type.startswith("image/"):
        return "image"
    if extension in VIDEO_EXTENSIONS or content_type.startswith("video/"):
        return "video"
    return "file"


def validate_attachment_file(file):
    if file.size > MAX_ATTACHMENT_SIZE:
        raise serializers.ValidationError("File size must be less than 5 MB.")

    # Images/videos are explicitly supported. Other extensions are accepted as
    # regular file attachments, so users can send PDFs, docs, archives, audio, etc.
    return file


def build_attachment_payload(message):
    if not message.attachment:
        return None

    return {
        "url": message.attachment.url,
        "name": message.attachment_name,
        "size": message.attachment_size,
        "type": message.attachment_type,
        "category": message.attachment_category or "file",
    }


def apply_attachment_metadata(message, file):
    message.attachment_name = file.name
    message.attachment_size = file.size
    message.attachment_type = getattr(file, "content_type", "") or "application/octet-stream"
    message.attachment_category = get_attachment_category(file)
    return message
