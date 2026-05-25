# chat/models.py
#
# Changes from original:
#
# 1. Channel / ChannelMember / Message — unchanged structurally.
#
# 2. DMRequest (NEW):
#    Implements request-based DM flow. Before two users can DM each other,
#    one must send a request that the other accepts. This preserves the
#    "users feel free but not harassed" philosophy described in the brief.
#
#    Flow:
#      sender -> POST /api/chat/dm-requests/          (creates request, status=pending)
#      receiver -> PATCH /api/chat/dm-requests/<id>/   (accept -> creates DM channel)
#      receiver -> DELETE /api/chat/dm-requests/<id>/  (decline)
#
#    Notes:
#    - Only one pending request between any pair at a time (unique_together).
#    - Once accepted, the request is NOT deleted — it's the audit trail.
#    - Admins bypass the request requirement (see DMListCreateView).
#
# 3. Block (NEW):
#    A user can block another workspace member. Blocking:
#    - Prevents the blocked user from sending DM requests
#    - Prevents the blocked user from sending messages in existing DMs
#    - Is private — the blocked user is NOT notified
#    BlockedUser.objects.filter(blocker=A, blocked=B).exists() is the check.
#
# 4. Report (NEW):
#    Users can report messages or other users. Reports go to workspace admins
#    only (not Anthropic-style trust & safety — this is the org admin).
#    Status flow: pending -> reviewed -> actioned / dismissed

from django.db import models
from django.contrib.auth.models import User
from django.db import models
from django.contrib.auth.models import User
import uuid


class Channel(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True, blank=True)
    is_private = models.BooleanField(default=False)
    is_dm = models.BooleanField(default=False)
    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="channels",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        "workspaces.Team",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="channels",
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ChannelMember(models.Model):
    ROLE_CHOICES = [("admin", "Admin"), ("member", "Member")]

    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("channel", "user")


class Message(models.Model):
    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(
        blank=True
    )  # CHANGED: blank=True now, because a message might just be a file

    # NEW: MVP Scalability - Add threads later without migrating
    parent_message = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )

    # NEW: Edit & Delete Tracking (Compliance & Privacy)
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(
        default=False
    )  # Soft delete: preserves conversation flow

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    # NEW: Helper property to safely return content for soft-deleted messages
    @property
    def safe_content(self):
        return "[Message deleted]" if self.is_deleted else self.content


# ── DM Request ────────────────────────────────────────────────────────────────


class DMRequest(models.Model):
    """
    A request to open a DM conversation. The receiver must accept before
    a DM channel is created. This is the core of request-based communication.

    Status transitions:
      pending  -> accepted  (receiver accepts; DM channel auto-created)
      pending  -> declined  (receiver declines)
      accepted -> (terminal)
      declined -> (terminal; sender can re-request after 24h — future feature)
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
    ]

    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_dm_requests"
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_dm_requests"
    )
    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="dm_requests",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    # Once accepted, the created DM channel is stored here
    dm_channel = models.ForeignKey(
        Channel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dm_request",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Only one pending request between a pair at a time.
        # Note: a separate request from B->A after A->B is declined is fine.
        unique_together = ("sender", "receiver", "workspace")

    def __str__(self):
        return f"DMRequest {self.sender} -> {self.receiver} [{self.status}]"


# ── Block ─────────────────────────────────────────────────────────────────────


class Block(models.Model):
    """
    User A blocks User B within a workspace.
    - B cannot send DM requests to A.
    - B cannot send messages in existing DMs with A.
    - B is unaware they are blocked (no notification).
    - Admins cannot be blocked from announcement/system channels.
    """

    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocking")
    blocked = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="blocked_by"
    )
    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="blocks",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("blocker", "blocked", "workspace")

    def __str__(self):
        return f"Block: {self.blocker} -> {self.blocked}"


# ── Report ────────────────────────────────────────────────────────────────────


class Report(models.Model):
    """
    A user reports a message or another user to workspace admins.
    Admins see reports in the admin panel (and future: admin dashboard).

    report_type:
      - "message"  -> reported_message is set
      - "user"     -> reported_user is set

    Admins can mark as reviewed + add a note. This keeps a full audit trail.
    """

    REPORT_TYPE_CHOICES = [
        ("message", "Message"),
        ("user", "User"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("reviewed", "Reviewed"),
        ("actioned", "Actioned"),
        ("dismissed", "Dismissed"),
    ]

    reporter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="reports_filed"
    )
    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="reports",
    )
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    reason = models.TextField(help_text="Reporter's explanation")

    # One of these will be set depending on report_type
    reported_message = models.ForeignKey(
        Message,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
    )
    reported_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_against",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_note = models.TextField(blank=True, help_text="Admin's resolution note")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report by {self.reporter} [{self.report_type}] - {self.status}"


# chat/models.py - ADD THIS TO EXISTING MODELS FILE
# This is the new section to add to chat/models.py

# ── Notification ──────────────────────────────────────────────────────────


class Notification(models.Model):
    """
    Persistent notification record. Stores notifications that need to be delivered
    or have been delivered to users. This is the audit trail for all notifications.

    Flow:
      1. Event occurs (DM request sent, mention created, etc.)
      2. NotificationService.create() stores record in DB
      3. NotificationService.emit() sends realtime event via WebSocket
      4. If user offline: Notification row stays in DB until read
      5. If user online: Notification row created, WebSocket sends, user marks read
    """

    NOTIFICATION_TYPE_CHOICES = [
        ("dm_request", "DM Request"),
        ("dm_request_accepted", "DM Request Accepted"),
        ("mention", "Mention"),
        ("channel_invite", "Channel Invite"),
        ("block_created", "Block Created"),
        ("task_assigned", "Task Assigned"),
    ]

    STATUS_CHOICES = [
        ("unread", "Unread"),
        ("read", "Read"),
        ("archived", "Archived"),
    ]

    # Who receives this notification
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )

    # Which workspace this notification is scoped to
    workspace = models.ForeignKey(
        "workspaces.Workspace", on_delete=models.CASCADE, related_name="notifications"
    )

    # Type of notification
    notification_type = models.CharField(
        max_length=50, choices=NOTIFICATION_TYPE_CHOICES
    )

    # User who triggered the notification (sender, requester, etc.)
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications_sent",
    )

    # Generic foreign key data — store the related object ID and type
    # For DM requests: dm_request_id
    # For mentions: message_id
    # For channel invites: channel_id
    related_object_id = models.IntegerField(null=True, blank=True)

    # Human-readable content (fallback if object deleted)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unread")

    # Metadata stored as JSON for extensibility
    # e.g. {"dm_request_id": 42, "sender_name": "alice"}
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        # Index on recipient + workspace + status for fast queries
        indexes = [
            models.Index(fields=["recipient", "workspace", "status"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self):
        return f"Notification: {self.notification_type} for {self.recipient.username}"

    def mark_read(self):
        """Mark this notification as read."""
        from django.utils import timezone

        self.status = "read"
        self.read_at = timezone.now()
        self.save(update_fields=["status", "read_at"])


class NotificationPreference(models.Model):
    """
    User preferences for what notifications they receive.
    Allows users to silence specific notification types.
    """

    # Which user owns these preferences
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="notification_preferences"
    )

    # Toggle for each notification type
    dm_requests_enabled = models.BooleanField(default=True)
    mentions_enabled = models.BooleanField(default=True)
    channel_invites_enabled = models.BooleanField(default=True)
    task_assignments_enabled = models.BooleanField(default=True)

    # Global notification toggle
    all_notifications_muted = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification preferences for {self.user.username}"

# ── File Attachments ────────────────────────────────────────────────────────

def attachment_upload_path(instance, filename):
    """
    Secure path: media/uploads/workspace_id/channel_id/message_id/uuid.ext
    Uses UUID to prevent path manipulation, collisions, and unsafe characters.
    """
    # Extract the file extension from the original filename
    ext = filename.split('.')[-1].lower() if '.' in filename else 'bin'
    
    # Generate a safe, unique filename
    safe_filename = f"{uuid.uuid4()}.{ext}"
    
    return f"uploads/{instance.message.channel.workspace_id}/{instance.message.channel_id}/{instance.message.id}/{safe_filename}"

class MessageAttachment(models.Model):
    """
    Separates file data from message text. 
    This is crucial for scalability: fetching messages doesn't pull heavy file bytes,
    and we can restrict file access independently of message access.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to=attachment_upload_path)
    original_filename = models.CharField(max_length=255) # Stored for UI display ONLY
    file_type = models.CharField(max_length=100) # e.g., 'image/png', 'application/pdf'
    file_size = models.PositiveIntegerField() # in bytes
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename