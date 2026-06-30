from django.db import models
from django.contrib.auth.models import User
class ClockEntry(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="clock_entries"
    )
    clock_in = models.DateTimeField(auto_now_add=True)
    clock_out = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-clock_in"]

    def __str__(self):
        return f"{self.user.username} - {self.clock_in}"
