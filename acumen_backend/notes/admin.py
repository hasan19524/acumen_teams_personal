from django.contrib import admin
from .models import Note, Notebook, NoteAttachment


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "created_at"]
    search_fields = ["name", "user__username"]


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "user",
        "notebook",
        "is_pinned",
        "is_favorite",
        "created_at",
    ]
    search_fields = ["title", "user__username"]
    list_filter = ["is_pinned", "is_favorite"]


@admin.register(NoteAttachment)
class NoteAttachmentAdmin(admin.ModelAdmin):
    list_display = ["original_filename", "note", "file_type", "file_size", "created_at"]
    search_fields = ["original_filename", "note__title"]
