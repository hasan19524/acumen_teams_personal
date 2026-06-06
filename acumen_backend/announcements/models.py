from django.db import models
from django.contrib.auth.models import User


class Announcement(models.Model):
    PRIORITY_CHOICES = [
        ("Normal", "Normal"),
        ("High", "High"),
        ("Critical", "Critical"),
    ]

    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="announcements",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        "workspaces.Team",
        on_delete=models.CASCADE,
        related_name="announcements",
        null=True,
        blank=True,
        help_text="Team this announcement targets. Null = workspace-wide announcement.",
    )
    title = models.CharField(max_length=300)
    content = models.TextField()
    tag = models.CharField(max_length=100, blank=True, default="General")
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="Normal"
    )
    pinned = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="announcements"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-pinned", "-created_at"]

    def __str__(self):
        return self.title
