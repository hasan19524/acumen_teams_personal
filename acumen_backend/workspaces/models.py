# workspaces/models.py

from django.db import models
from django.contrib.auth.models import User
import uuid


class Workspace(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_workspaces"
    )
    description = models.TextField(blank=True)
    logo = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    unassigned_team = models.OneToOneField(
        "Team",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_for_workspace",
        help_text="The default team users are assigned to when they join or are removed from all other teams.",
    )

    def __str__(self):
        return self.name


class WorkspaceInvite(models.Model):
    """Shareable invite links for joining a workspace."""

    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("disabled", "Disabled"),
    ]
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("manager", "Manager"),
        ("employee", "Employee"),
        ("guest", "Guest"),
    ]

    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="invites"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_invites"
    )
    role_to_assign = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default="employee"
    )
    max_uses = models.IntegerField(default=0)  # 0 = unlimited
    use_count = models.IntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        from django.utils import timezone

        if self.status != "active":
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        if self.max_uses > 0 and self.use_count >= self.max_uses:
            return False
        return True

    def clean(self):
        from django.core.exceptions import ValidationError
        from django.utils import timezone
        from datetime import timedelta

        if self.expires_at:
            now = timezone.now()
            min_expiry = now + timedelta(days=1)
            max_expiry = now + timedelta(days=30)

            if self.expires_at < min_expiry:
                raise ValidationError(
                    {"expires_at": "Invite must be valid for at least 1 day."}
                )
            if self.expires_at > max_expiry:
                raise ValidationError(
                    {"expires_at": "Invite cannot be valid for more than 30 days."}
                )

    def save(self, *args, **kwargs):
        from django.utils import timezone
        from datetime import timedelta

        # Default expiry: 4 days
        if not self.expires_at and self.status == "active":
            self.expires_at = timezone.now() + timedelta(days=4)
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invite to {self.workspace.name} ({self.token})"


class WorkspaceMembership(models.Model):
    """Replaces UserProfile workspace/role fields. Single source of truth for membership."""

    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("manager", "Manager"),
        ("employee", "Employee"),
        ("guest", "Guest"),
    ]

    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="employee")
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invited_members",
    )
    is_active = models.BooleanField(default=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("workspace", "user")

    def __str__(self):
        return f"{self.user.username} — {self.role} in {self.workspace.name}"

    # ── Permission helpers ──────────────────────────────────────────
    def can(self, permission: str) -> bool:
        return permission in ROLE_PERMISSIONS.get(self.role, set())


class Team(models.Model):
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="teams"
    )
    name = models.CharField(max_length=200)
    leader = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="led_teams"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_unassigned = models.BooleanField(
        default=False,
        help_text="True if this is the workspace's default unassigned team.",
    )

    def __str__(self):
        return f"{self.workspace.name} — {self.name}"


class TeamMembership(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="team_memberships"
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    left_at = models.DateTimeField(null=True, blank=True)
    is_leader = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["team", "user"],
                condition=models.Q(is_active=True),
                name="unique_active_team_member",
            )
        ]

    def __str__(self):
        return f"{self.user.username} in {self.team.name}"


class TeamInvite(models.Model):
    """
    An invitation to join a team within a workspace.
    Only team leaders, managers, admins, and owners can invite.
    Accepting automatically grants access to team chat, tasks, files, and announcements.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="invites")
    inviter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_team_invites"
    )
    invitee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_team_invites"
    )
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="team_invites"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the pending invite expires (4 days from creation).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["team", "invitee", "workspace", "status"],
                name="idx_teaminvite_lookup",
            )
        ]

    def __str__(self):
        return (
            f"TeamInvite: {self.invitee.username} -> {self.team.name} [{self.status}]"
        )


class PrivateGroupInvite(models.Model):
    """
    An invitation to join a private group.
    Accepting instantly joins the user. No second approval needed.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
    ]

    channel = models.ForeignKey(
        "chat.Channel", on_delete=models.CASCADE, related_name="group_invites"
    )
    inviter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_group_invites"
    )
    invitee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_group_invites"
    )
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="private_group_invites"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    expires_at = models.DateTimeField(
        null=True, blank=True, help_text="When the pending invite expires (24 hours)."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["channel", "invitee", "workspace", "status"],
                name="idx_groupinvite_lookup",
            )
        ]

    def __str__(self):
        return f"GroupInvite: {self.invitee.username} -> {self.channel.name} [{self.status}]"


# ── PERMISSION DEFINITIONS ──────────────────────────────────────────────────
ROLE_PERMISSIONS = {
    "owner": {
        "manage_workspace",
        "delete_workspace",
        "invite_members",
        "remove_members",
        "manage_roles",
        "create_teams",
        "delete_teams",
        "create_channels",
        "delete_channels",
        "send_messages",
        "create_tasks",
        "assign_tasks",
        "post_announcements",
        "mark_attendance",
        "view_analytics",
        "upload_files",
    },
    "admin": {
        "manage_workspace",
        "invite_members",
        "remove_members",
        "manage_roles",
        "create_teams",
        "delete_teams",
        "create_channels",
        "delete_channels",
        "send_messages",
        "create_tasks",
        "assign_tasks",
        "post_announcements",
        "mark_attendance",
        "view_analytics",
        "upload_files",
    },
    "manager": {
        "invite_members",
        "create_teams",
        "create_channels",
        "send_messages",
        "create_tasks",
        "assign_tasks",
        "post_announcements",
        "mark_attendance",
        "view_analytics",
        "upload_files",
    },
    "employee": {
        "send_messages",
        "create_tasks",
        "mark_attendance",
        "upload_files",
    },
    "guest": set(),
}
