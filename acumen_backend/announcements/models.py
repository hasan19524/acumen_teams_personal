from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from django.db.models.signals import post_delete
from django.dispatch import receiver


class Announcement(models.Model):
    PRIORITY_CHOICES = [
        ("normal", "Normal"),
        ("important", "Important"),
        ("urgent", "Urgent"),
    ]

    workspace = models.ForeignKey(
        "workspaces.Workspace", on_delete=models.CASCADE, related_name="announcements"
    )
    teams = models.ManyToManyField(
        "workspaces.Team", blank=True, related_name="announcements"
    )

    title = models.CharField(max_length=300)
    content = models.TextField()
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="normal"
    )
    pinned = models.BooleanField(default=False)

    is_archived = models.BooleanField(default=False)
    expiry_date = models.DateTimeField(null=True, blank=True)
    is_edited = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="announcements"
    )
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-pinned", "-created_at"]

    def __str__(self):
        return self.title


class AnnouncementRead(models.Model):
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name="reads"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="read_announcements"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("announcement", "user")


class AnnouncementAttachment(models.Model):
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name="attachments"
    )
    file = models.FileField(upload_to="announcements/")
    file_name = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        try:
            old_obj = AnnouncementAttachment.objects.get(pk=self.pk)
            if old_obj.file and old_obj.file != self.file:
                old_obj.file.delete(save=False)
        except AnnouncementAttachment.DoesNotExist:
            pass
        super().save(*args, **kwargs)

    def __str__(self):
        return self.file_name


@receiver(post_delete, sender=AnnouncementAttachment)
def delete_announcement_attachment_on_delete(sender, instance, **kwargs):
    if instance.file:
        instance.file.delete(save=False)
