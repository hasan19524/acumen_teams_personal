# chat/notification_serializers.py
# NEW FILE: Serializers for notifications

from rest_framework import serializers
from chat.models import Notification, NotificationPreference
from django.contrib.auth.models import User


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
