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
    CHANNEL_TYPE_CHOICES = [
        ("official", "Official Channel"),
        ("team", "Team Chat"),
        ("private_group", "Private Group"),
        ("dm", "Direct Message"),
    ]
    channel_type = models.CharField(
        max_length=20,
        choices=CHANNEL_TYPE_CHOICES,
        default="official",
        help_text="Determines channel behavior and membership rules.",
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_channels",
        help_text="Owner for private groups. Null for official/DMs.",
    )
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
    is_pending = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True for private groups that haven't activated yet (creator + 1 member required).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.channel_type == "dm":
            self.is_dm = True
        super().save(*args, **kwargs)

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
    is_active = models.BooleanField(default=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["channel", "user"],
                condition=models.Q(is_active=True),
                name="unique_active_channel_member",
            )
        ]


class Message(models.Model):
    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(
        blank=True
    )  # CHANGED: blank=True now, because a message might just be a file

    # NEW: Client-generated UUID for idempotency and optimistic reconciliation.
    # Prevents duplicate messages on network retries and allows the frontend
    # to match WS broadcasts with pending optimistic messages.
    client_id = models.CharField(
        max_length=36,
        null=True,
        blank=True,
        db_index=True,
        help_text="Client-generated UUID for idempotency and deduplication",
    )

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
        # Ensures that a client_id can only be used once per channel.
        # This is the database-level enforcement of upload idempotency.
        # The condition allows messages without a client_id (null) to coexist.
        constraints = [
            models.UniqueConstraint(
                fields=["channel", "client_id"],
                name="unique_message_client_id_per_channel",
                condition=~models.Q(client_id=None),
            )
        ]

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
      pending  -> rejected  (receiver rejects)
      pending  -> expired   (10-day timer runs out)
      rejected -> pending   (receiver undoes within 24h window)
      accepted -> (terminal)
      expired  -> (terminal)
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
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
    initial_message = models.TextField(
        blank=True,
        help_text="The single introductory message sent with the DM request."
    )
    expires_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the pending request expires (10 days from creation)."
    )
    rejected_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the request was rejected."
    )
    cooldown_until = models.DateTimeField(
        null=True, blank=True,
        help_text="Sender cannot re-request until this time (30 days after 24h undo window)."
    )
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
        # Removed unique_together. Validation in views handles logic so that
        # a sender can re-request after cooldown, but cannot have two pending at once.
        pass

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


# ── File Attachments ────────────────────────────────────────────────────────


def attachment_upload_path(instance, filename):
    """
    Secure path: media/uploads/workspace_id/channel_id/message_id/uuid.ext
    Uses UUID to prevent path manipulation, collisions, and unsafe characters.
    """
    # Extract the file extension from the original filename
    ext = filename.split(".")[-1].lower() if "." in filename else "bin"

    # Generate a safe, unique filename
    safe_filename = f"{uuid.uuid4()}.{ext}"

    return f"uploads/{instance.message.channel.workspace_id}/{instance.message.channel_id}/{instance.message.id}/{safe_filename}"


class MessageAttachment(models.Model):
    """
    Separates file data from message text.
    This is crucial for scalability: fetching messages doesn't pull heavy file bytes,
    and we can restrict file access independently of message access.
    """

    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="attachments"
    )
    file = models.FileField(upload_to=attachment_upload_path)
    original_filename = models.CharField(max_length=255)  # Stored for UI display ONLY
    file_type = models.CharField(max_length=100)  # e.g., 'image/png', 'application/pdf'
    file_size = models.PositiveIntegerField()  # in bytes
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename


# ── Reactions ────────────────────────────────────────────────────────────────


class Reaction(models.Model):
    """
    Stores emoji reactions to messages.
    A user can react with multiple different emojis on the same message,
    but only once per emoji (enforced by unique_together).
    """

    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="reactions"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    emoji = models.CharField(
        max_length=10
    )  # Stores the actual emoji character e.g. '👍'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user", "emoji")

    def __str__(self):
        return f"{self.user} reacted {self.emoji} on message {self.message.id}"


# ── Read Receipts ────────────────────────────────────────────────────────────


class MessageRead(models.Model):
    """
    Tracks exactly when a user reads a specific message.
    Powers the WhatsApp-style blue double ticks (✅✅).
    """

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="reads")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user")  # A user only reads a message once

    def __str__(self):
        return f"{self.user} read message {self.message.id} at {self.read_at}"
