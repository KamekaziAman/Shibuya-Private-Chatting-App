from rest_framework import serializers
from .models import Conversation
from .models import Message
from .attachments import (
    apply_attachment_metadata,
    build_attachment_payload,
    validate_attachment_file,
)
from .presence import build_presence_payload


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = "__all__"


class ConversationListSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    last_seen = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "user_id",
            "username",
            "last_message",
            "timestamp",
            "unread_count",
            "is_online",
            "last_seen",
        ]

    def get_other_user(self, obj):
        user = self.context["request"].user
        return obj.participant2 if obj.participant1_id == user.id else obj.participant1

    def get_username(self, obj):
        return self.get_other_user(obj).username

    def get_user_id(self, obj):
        return self.get_other_user(obj).id

    def get_last_message(self, obj):
        message = obj.messages.order_by("-timestamp").first()
        if not message:
            return ""
        if message.content:
            return message.content
        if message.attachment:
            return message.attachment_name or message.attachment_category.title()
        return ""

    def get_timestamp(self, obj):
        message = obj.messages.order_by("-timestamp").first()
        return message.timestamp if message else obj.created_at

    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_is_online(self, obj):
        presence = getattr(self.get_other_user(obj), "presence", None)
        return build_presence_payload(presence)[0]

    def get_last_seen(self, obj):
        presence = getattr(self.get_other_user(obj), "presence", None)
        return presence.last_seen if presence else None


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source="sender.username", read_only=True)
    attachment = serializers.SerializerMethodField()
    attachment_file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Message
        fields = [
            "id",
            "client_id",
            "sender",
            "content",
            "attachment",
            "attachment_file",
            "timestamp",
            "is_read",
        ]
        read_only_fields = ["id", "client_id", "sender", "attachment", "timestamp", "is_read"]
        extra_kwargs = {"content": {"required": False, "allow_blank": True}}

    def get_attachment(self, obj):
        return build_attachment_payload(obj)

    def validate_attachment_file(self, value):
        return validate_attachment_file(value)

    def validate(self, attrs):
        content = attrs.get("content", "").strip()
        attachment = attrs.get("attachment_file")
        if not content and not attachment:
            raise serializers.ValidationError("Message content or attachment is required.")
        attrs["content"] = content
        return attrs

    def validate_content(self, value):
        content = value.strip()
        return content

    def create(self, validated_data):
        attachment_file = validated_data.pop("attachment_file", None)
        message = Message(**validated_data)
        if attachment_file:
            message.attachment = attachment_file
            apply_attachment_metadata(message, attachment_file)
        message.save()
        return message
