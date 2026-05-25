# chat/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Channel,
    ChannelMember,
    Message,
    MessageAttachment,
    Notification,
    NotificationPreference,
)

# ── User & Channel Serializers ────────────────────────────────────────────────


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "full_name"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class ChannelSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    # For DM channels, expose the "other" user's info
    dm_partner = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = "__all__"

    def get_member_count(self, obj):
        return obj.members.count()

    def get_dm_partner(self, obj):
        if not obj.is_dm:
            return None
        request = self.context.get("request")
        if not request:
            return None
        other = obj.members.exclude(user=request.user).select_related("user").first()
        if other:
            return UserMiniSerializer(other.user).data
        return None


# ── Message & Attachment Serializers ──────────────────────────────────────────


class MessageAttachmentSerializer(serializers.ModelSerializer):
    """
    Serializes file metadata and generates a full URL for the frontend.
    """

    # FileField by default just returns the relative path. We need the full URL.
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MessageAttachment
        fields = ["id", "file_url", "original_filename", "file_type", "file_size"]

    def get_file_url(self, obj):
        # This constructs the full http://localhost:8000/media/uploads/... URL
        # In production with S3/Cloudflare, obj.file.url already returns the full URL
        request = self.context.get("request")
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class MessageSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    created_time = serializers.DateTimeField(
        source="created_at",
        format="%I:%M %p",
        read_only=True,
    )

    # NEW: Use the safe_content property so soft-deleted messages return "[Message deleted]"
    display_content = serializers.CharField(source="safe_content", read_only=True)

    # NEW: Nested attachments (allows multiple files per message)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "channel",
            "sender",
            "sender_name",
            "content",
            "display_content",
            "is_edited",
            "edited_at",
            "is_deleted",
            "attachments",
            "created_at",
            "created_time",
        ]
        # Content is writable (for creating/editing), but edit/delete tracking is read-only
        read_only_fields = ["is_edited", "edited_at", "is_deleted"]


# ── Notification Serializers ──────────────────────────────────────────────────


class NotificationSerializer(serializers.ModelSerializer):
    """Serialize Notification model for API responses."""

    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True)
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    workspace_name = serializers.CharField(source="workspace.name", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "actor_id",
            "actor_name",
            "actor_username",
            "title",
            "description",
            "status",
            "metadata",
            "related_object_id",
            "workspace_name",
            "created_at",
            "read_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "read_at",
            "actor_id",
            "actor_name",
            "actor_username",
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serialize user notification preferences."""

    class Meta:
        model = NotificationPreference
        fields = [
            "dm_requests_enabled",
            "mentions_enabled",
            "channel_invites_enabled",
            "task_assignments_enabled",
            "all_notifications_muted",
            "updated_at",
        ]
