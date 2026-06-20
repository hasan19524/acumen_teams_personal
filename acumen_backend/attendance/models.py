from django.db import models
from django.contrib.auth.models import User


class Attendance(models.Model):
    workspace = models.ForeignKey(
        "workspaces.Workspace", 
        on_delete=models.CASCADE, 
        related_name="attendance_records",
        null=True, # Null true just for migration safety, view will always enforce it
        blank=True
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "date")

    def __str__(self):
        return f"{self.user.username} - {self.date}"
