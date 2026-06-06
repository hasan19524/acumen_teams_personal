from django.db import models
from django.contrib.auth.models import User


class Task(models.Model):
    PRIORITY_CHOICES = [("High", "High"), ("Medium", "Medium"), ("Low", "Low")]
    STATUS_CHOICES = [("todo", "To Do"), ("progress", "In Progress"), ("done", "Done")]
    TASK_TYPE_CHOICES = [
        ("personal", "Personal"),
        ("team", "Team"),
    ]

    task_type = models.CharField(
        max_length=20,
        choices=TASK_TYPE_CHOICES,
        default="personal",
        help_text="Personal tasks are private. Team tasks are visible to all team members.",
    )

    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        "workspaces.Team",
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True,
        help_text="Required for team tasks. Must be null for personal tasks.",
    )
    title = models.CharField(max_length=300)
    assignee_name = models.CharField(max_length=200, blank=True, default="You")
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_tasks"
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="Medium"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
