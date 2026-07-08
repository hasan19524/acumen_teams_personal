from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Note, Notebook, NoteAttachment


class NoteAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = NoteAttachment
        fields = ["id", "url", "original_filename", "file_type", "file_size", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_url(self, obj):
        return obj.file.url if obj.file else None


class NotebookSerializer(serializers.ModelSerializer):
    """
    Serializer for personal notebooks.
    
    Includes:
    - note_count: Read-only field showing the number of notes in the notebook
    - Validation for color format
    """
    note_count = serializers.SerializerMethodField()

    class Meta:
        model = Notebook
        fields = ['id', 'name', 'color', 'note_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_note_count(self, obj):
        """Return the count of active notes in the notebook."""
        return obj.notes.count()

    def validate_color(self, value):
        """
        Validate that the color is a valid hex color code.
        Format: #RRGGBB where each component is 0-9 or A-F.
        """
        import re
        if not re.match(r'^#[0-9A-Fa-f]{6}$', value):
            raise serializers.ValidationError(
                "Color must be a valid hex color code (e.g., #FF5733)."
            )
        return value

    def validate_name(self, value):
        """Ensure notebook name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError(
                "Notebook name cannot be empty."
            )
        return value.strip()


class NoteSerializer(serializers.ModelSerializer):
    """
    Serializer for personal notes.
    
    Includes:
    - notebook_name: Read-only field showing the notebook's name (if assigned)
    - user: Read-only field showing the user's username
    - Validation for title, content, and tags
    """
    notebook_name = serializers.CharField(
        source='notebook.name',
        read_only=True,
        allow_null=True,
        help_text="Display name of the notebook (if assigned)."
    )
    user = serializers.CharField(
        source='user.username',
        read_only=True,
        help_text="Username of the note user."
    )
    attachments = NoteAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = [
            'id',
            'title',
            'content',
            'notebook',
            'notebook_name',
            'user',
            'is_favorite',
            'is_pinned',
            'tags',
            'created_at',
            'updated_at',
            'attachments',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'notebook_name',
            'user',
        ]

    def validate_title(self, value):
        """Ensure title is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError(
                "Note title cannot be empty."
            )
        return value.strip()

    def validate_tags(self, value):
        """
        Validate tags field.
        - Must be a list
        - Each tag must be a non-empty string
        - Maximum 10 tags per note
        - Each tag max 50 characters
        """
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "Tags must be a list of strings."
            )
        
        if len(value) > 10:
            raise serializers.ValidationError(
                "A note can have a maximum of 10 tags."
            )
        
        for tag in value:
            if not isinstance(tag, str):
                raise serializers.ValidationError(
                    "Each tag must be a string."
                )
            if not tag or not tag.strip():
                raise serializers.ValidationError(
                    "Tags cannot be empty strings."
                )
            if len(tag.strip()) > 50:
                raise serializers.ValidationError(
                    "Each tag cannot exceed 50 characters."
                )
        
        # Remove duplicates and trim whitespace
        return list(set(tag.strip() for tag in value))

    def validate(self, data):
        """
        Validate the entire note object.
        Ensure notebook belongs to the same user if provided.
        """
        notebook = data.get('notebook')
        request = self.context.get('request')
        
        if notebook and request and notebook.user != request.user:
            raise serializers.ValidationError(
                {
                    'notebook': "You can only add notes to notebooks you own."
                }
            )
        
        return data