# acumen_backend/workspaces/models.py
from django.db import models
from django.contrib.auth.models import User
import uuid
from django.db.models import Q


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


class TeamType(models.TextChoices):
    STANDARD = "standard", "Standard"
    GENERAL = "general", "General"
    UNASSIGNED = "unassigned", "Unassigned"
    MANAGEMENT = "management", "Management"


class Team(models.Model):
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="teams"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="", help_text="Description of the team's purpose.")
    created_at = models.DateTimeField(auto_now_add=True)
    team_type = models.CharField(
        max_length=20, choices=TeamType.choices, default=TeamType.STANDARD
    )

    def __str__(self):
        return f"{self.workspace.name} — {self.name}"


class WorkspaceInvite(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("disabled", "Disabled"),
    ]
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("member", "Member"),
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
        max_length=20, choices=ROLE_CHOICES, default="member"
    )
    max_uses = models.IntegerField(default=0)
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

    def save(self, *args, **kwargs):
        from django.utils import timezone
        from datetime import timedelta

        if not self.expires_at and self.status == "active":
            self.expires_at = timezone.now() + timedelta(days=4)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invite to {self.workspace.name} ({self.token})"


class WorkspaceMembership(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("member", "Member"),
        ("guest", "Guest"),
    ]

    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
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
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user"],
                condition=Q(is_active=True),
                name="unique_active_workspace_member",
            )
        ]

    def __str__(self):
        return f"{self.user.username} — {self.role} in {self.workspace.name}"

    def can(self, permission: str) -> bool:
        return permission in ROLE_PERMISSIONS.get(self.role, set())


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
                condition=Q(is_active=True),
                name="unique_active_team_member",
            )
        ]

    def __str__(self):
        return f"{self.user.username} in {self.team.name}"


class TeamInvite(models.Model):
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
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["team", "invitee", "workspace", "status"],
                name="idx_teaminvite_lookup",
            )
        ]


class PrivateGroupInvite(models.Model):
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
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["channel", "invitee", "workspace", "status"],
                name="idx_groupinvite_lookup",
            )
        ]


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
    "member": {"send_messages", "create_tasks", "mark_attendance", "upload_files"},
    "guest": set(),
}
