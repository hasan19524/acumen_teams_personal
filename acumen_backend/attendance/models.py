# acumen_backend/attendance/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class WorkspaceAttendanceConfig(models.Model):
    workspace = models.OneToOneField(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="attendance_config",
    )
    shift_start = models.TimeField(default="09:00")
    shift_end = models.TimeField(default="18:00")
    grace_period_minutes = models.PositiveIntegerField(default=15)
    working_days = models.CharField(max_length=20, default="0,1,2,3,4")
    half_day_threshold = models.DurationField(default=timezone.timedelta(hours=4))
    productivity_cycle_days = models.PositiveIntegerField(
        default=14, help_text="Evaluation cycle in days (e.g., 7, 14, 30)"
    )

    def is_working_day(self, date_obj):
        return str(date_obj.weekday()) in self.working_days.split(",")


class Attendance(models.Model):
    STATUS_CHOICES = [
        ("present", "Present"),
        ("late", "Late Arrival"),
        ("half_day", "Half Day"),
        ("absent", "Absent"),
        ("leave", "On Leave"),
        ("holiday", "Holiday"),
    ]

    CLOCK_OUT_REASONS = [
        ("MANUAL", "Manual"),
        ("AUTO_SHIFT_END", "Auto Shift End"),
        ("ADMIN", "Admin Override"),
    ]

    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="absent")
    clock_out_reason = models.CharField(
        max_length=20, choices=CLOCK_OUT_REASONS, null=True, blank=True
    )
    is_late = models.BooleanField(default=False)
    is_half_day = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "date", "workspace")
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["workspace", "date"]),
            models.Index(fields=["user", "date"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.status})"
