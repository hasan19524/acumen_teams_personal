from django.db import models
from django.contrib.auth.models import User


class Channel(models.Model):
    name = models.CharField(max_length=120)
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ChannelMember(models.Model):
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="members"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("channel", "user")


class Message(models.Model):
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]