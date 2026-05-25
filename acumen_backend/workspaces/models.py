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

    def __str__(self):
        return f"{self.workspace.name} — {self.name}"


class TeamMembership(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="team_memberships"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "user")

    def __str__(self):
        return f"{self.user.username} in {self.team.name}"


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
