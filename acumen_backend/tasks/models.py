from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Task(models.Model):
    PRIORITY_CHOICES = [
        ("critical", "Critical"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]
    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("pending_approval", "Pending Approval"),
        ("overdue", "Overdue"), # Kept for legacy/data consistency, computed dynamically for Phase 3+
    ]
    TASK_TYPE_CHOICES = [
        ("personal", "Personal"),
        ("assigned", "Assigned"),
        ("team", "Team"),
    ]

    task_type = models.CharField(
        max_length=20,
        choices=TASK_TYPE_CHOICES,
        default="personal",
        help_text="Personal tasks are private. Assigned tasks are collaborative.",
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
        help_text="Used if assigned to a whole team.",
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default="")
    assignee_name = models.CharField(
        max_length=200, blank=True, default="You"
    )  # Kept for backward compatibility
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tasks_assigned_to_me",
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_tasks"
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="medium"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    due_date = models.DateTimeField(null=True, blank=True)
    requires_approval = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_tasks",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks_completed_by",
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    archive_after = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "status"]),
            models.Index(fields=["workspace", "task_type"]),
            models.Index(fields=["workspace", "assigned_to"]),
            models.Index(fields=["workspace", "created_by"]),
            models.Index(fields=["workspace", "team"]),
            models.Index(fields=["is_deleted", "is_archived"]),
        ]

    def __str__(self):
        return self.title

    def check_overdue(self):
        """Auto-transition to overdue if past due_date and not completed."""
        if self.due_date and self.status in ("todo", "in_progress"):
            if timezone.now() > self.due_date:
                self.status = "overdue"
                self.save(update_fields=["status", "updated_at"])
                return True
        return False

    def mark_completed(self, completed_by_user):
        """Mark task as completed. Set archive_after to 7 days."""
        from datetime import timedelta
        self.status = "completed"
        self.completed_at = timezone.now()
        self.completed_by = completed_by_user
        self.archive_after = timezone.now() + timedelta(days=7)
        self.save(
            update_fields=[
                "status",
                "completed_at",
                "completed_by",
                "archive_after",
                "updated_at",
            ]
        )

    def reopen(self):
        """Reopen a completed/overdue task."""
        self.status = "in_progress"
        self.completed_at = None
        self.completed_by = None
        self.archive_after = None
        self.is_approved = False
        self.save(
            update_fields=[
                "status",
                "completed_at",
                "completed_by",
                "archive_after",
                "is_approved",
                "updated_at",
            ]
        )

    def approve(self):
        """Approve a task that requires approval."""
        self.is_approved = True
        self.save(update_fields=["is_approved", "updated_at"])

    def archive_if_ready(self):
        """Auto-archive if archive_after has passed."""
        if self.archive_after and timezone.now() >= self.archive_after:
            self.is_archived = True
            self.save(update_fields=["is_archived", "updated_at"])
            return True
        return False


class TaskActivity(models.Model):
    """Activity timeline for a task."""

    ACTION_CHOICES = [
        ("created", "Created"),
        ("assigned", "Assigned"),
        ("status_changed", "Status Changed"),
        ("completed", "Completed"),
        ("reopened", "Reopened"),
        ("updated", "Updated"),
        ("approved", "Approved"),
        ("overdue", "Overdue"),
        ("archived", "Archived"),
        ("comment_added", "Comment Added"),
        ("attachment_uploaded", "Attachment Uploaded"),
    ]

    id = models.BigAutoField(primary_key=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="activities")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="task_activities"
    )
    detail = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name_plural = "task activities"

    def __str__(self):
        return f"{self.task.title} — {self.action}"


class TaskMember(models.Model):
    """Tracks individual participation and status for team tasks."""
    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="task_participations")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    completed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["task", "user"],
                condition=models.Q(is_active=True),
                name="unique_active_task_member",
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.task.title} [{self.status}]"


class TaskComment(models.Model):
    """Task discussion comments."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="task_comments")
    message = models.TextField()
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author.username} on {self.task.title}"


class TaskAttachment(models.Model):
    """Task file attachments."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="attachments")
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="task_attachments")
    file = models.FileField(upload_to='task_attachments/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.file_name
