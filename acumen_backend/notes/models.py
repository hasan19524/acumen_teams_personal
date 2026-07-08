import uuid
import os
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.core.validators import RegexValidator

User = get_user_model()


class Notebook(models.Model):
    """
    Personal notebook container.
    Organizes notes into logical groups (e.g., "Work", "Personal", "Projects").
    Each notebook belongs to exactly one user.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notebooks',
        help_text="The user who owns this notebook."
    )
    name = models.CharField(
        max_length=100,
        help_text="Display name for the notebook."
    )
    color = models.CharField(
        max_length=7,
        default="#6366f1",
        validators=[
            RegexValidator(
                regex=r'^#[0-9A-Fa-f]{6}$',
                message='Color must be a valid hex color code (e.g., #FF5733).',
                code='invalid_hex_color'
            )
        ],
        help_text="Hex color code for notebook display (e.g., #6366f1)."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the notebook was created."
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notebook'
        verbose_name_plural = 'Notebooks'

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Note(models.Model):
    """
    Personal note.
    Each note belongs to exactly one user and optionally to a notebook.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notes',
        help_text="The user who owns this note."
    )
    notebook = models.ForeignKey(
        Notebook,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notes',
        help_text="Optional notebook this note belongs to."
    )
    title = models.CharField(
        max_length=200,
        default="Untitled Note",
        help_text="Title of the note."
    )
    content = models.TextField(
        blank=True,
        help_text="The note's content. Supports plain text and markdown."
    )
    is_favorite = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether this note is marked as a favorite."
    )
    is_pinned = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether this note is pinned to the top."
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="List of string tags for categorization (e.g., ['urgent', 'work'])."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the note was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the note was last updated."
    )

    class Meta:
        ordering = ['-is_pinned', '-updated_at']
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'
        indexes = [
            models.Index(fields=['user', '-is_pinned', '-updated_at']),
            models.Index(fields=['user', '-updated_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
    def clean(self):
        """Validate notebook usership."""
        from django.core.exceptions import ValidationError
        if self.notebook and self.notebook.user != self.user:
            raise ValidationError(
                "A note can only belong to a notebook owned by the same user."
            )


def note_attachment_upload_path(instance, filename):
    ext = filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    return f"note_attachments/{instance.note.id}/{unique_name}"


class NoteAttachment(models.Model):
    note = models.ForeignKey(
        "Note", on_delete=models.CASCADE, related_name="attachments"
    )
    file = models.FileField(upload_to=note_attachment_upload_path)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.original_filename} → Note {self.note_id}"


@receiver(post_delete, sender=NoteAttachment)
def delete_attachment_file_on_model_delete(sender, instance, **kwargs):
    """Delete the S3/local file when a NoteAttachment row is deleted."""
    if instance.file:
        try:
            instance.file.delete(save=False)
        except Exception:
            pass