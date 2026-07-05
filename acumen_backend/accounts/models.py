from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError


def get_default_notification_prefs():
    return {
        "mentions": True,
        "tasks": True,
        "announcements": True,
        "approvals": True,
        "dm": True,
        "email": True,
    }


THEME_CHOICES = [
    ("dark", "Dark"),
    ("light", "Light"),
    ("system", "System"),
]

FONT_SIZE_CHOICES = [
    ("compact", "Compact"),
    ("comfortable", "Comfortable"),
    ("large", "Large"),
]

PROFILE_VISIBILITY_CHOICES = [
    ("everyone", "Everyone"),
    ("workspace", "Workspace"),
    ("private", "Private"),
]


def validate_image_file(image):
    if not image:
        return

    max_size = 5 * 1024 * 1024  # 5MB
    allowed_types = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
    ]

    if image.size > max_size:
        raise ValidationError("Image size must be less than 5MB.")

    if hasattr(image, "content_type") and image.content_type not in allowed_types:
        raise ValidationError("Only PNG, JPG, JPEG, and WEBP files are allowed.")


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    profile_image = models.ImageField(
        upload_to="profile/",
        null=True,
        blank=True,
        default=None,
        validators=[validate_image_file],
    )
    bio = models.TextField(max_length=1000, blank=True, null=True)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)

    appearance_theme = models.CharField(
        max_length=20, choices=THEME_CHOICES, default="dark"
    )
    font_size = models.CharField(
        max_length=20, choices=FONT_SIZE_CHOICES, default="comfortable"
    )
    compact_mode = models.BooleanField(default=False)

    timezone = models.CharField(max_length=50, default="UTC")
    language = models.CharField(max_length=10, default="en")
    date_format = models.CharField(max_length=20, default="MM/DD/YYYY")
    time_format = models.CharField(max_length=10, default="24h")

    show_online_status = models.BooleanField(default=True)
    show_last_seen = models.BooleanField(default=True)
    allow_dm = models.BooleanField(default=True)
    allow_team_invites = models.BooleanField(default=True)
    profile_visibility = models.CharField(
        max_length=20, choices=PROFILE_VISIBILITY_CHOICES, default="workspace"
    )

    notification_preferences = models.JSONField(default=get_default_notification_prefs)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def save(self, *args, **kwargs):
        # Delete old image from S3 if it's being replaced
        try:
            old_obj = Profile.objects.get(pk=self.pk)
            if old_obj.profile_image and old_obj.profile_image != self.profile_image:
                old_obj.profile_image.delete(save=False)
        except Profile.DoesNotExist:
            pass

        super().save(*args, **kwargs)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, "profile"):
        instance.profile.save()


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
