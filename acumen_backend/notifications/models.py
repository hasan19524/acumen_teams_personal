from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ("chat_created", "Chat Created"),
        ("channel_joined", "Channel Joined"),
        ("message_received", "Message Received"),
        ("mention", "Mention"),
        ("task_assigned", "Task Assigned"),
        ("announcement", "Announcement"),
        ("workspace_event", "Workspace Event"),
        ("dm_request", "DM Request"),
        ("dm_request_accepted", "DM Request Accepted"),
        ("channel_invite", "Channel Invite"),
    ]

    STATUS_CHOICES = [
        ("unread", "Unread"),
        ("read", "Read"),
        ("archived", "Archived"),
    ]

    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    workspace = models.ForeignKey(
        "workspaces.Workspace", on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(
        max_length=50, choices=NOTIFICATION_TYPE_CHOICES
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications_sent",
    )
    related_object_id = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unread")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "workspace", "status"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self):
        return f"Notification: {self.notification_type} for {self.recipient.username}"

    def mark_read(self):
        from django.utils import timezone

        self.status = "read"
        self.read_at = timezone.now()
        self.save(update_fields=["status", "read_at"])


class NotificationPreference(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="notification_preferences"
    )
    NOTIFICATION_TYPE_CHOICES = [
        ("chat_created", "Chat Created"),
        ("channel_joined", "Channel Joined"),
        ("message_received", "Message Received"),
        ("mention", "Mention"),
        ("task_assigned", "Task Assigned"),
        ("announcement", "Announcement"),
        ("workspace_event", "Workspace Event"),
        ("dm_request", "DM Request"),
        ("dm_request_accepted", "DM Request Accepted"),
        ("channel_invite", "Channel Invite"),
    ]
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        pass

    def __str__(self):
        return f"Notification preferences for {self.user.username}"
