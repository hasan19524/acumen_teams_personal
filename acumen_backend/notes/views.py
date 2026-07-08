from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q, Prefetch
from .models import Note, Notebook, NoteAttachment
from .serializers import NoteSerializer, NotebookSerializer, NoteAttachmentSerializer
from .permissions import Isuser
from chat.services.file_service import validate_upload_payload, validate_file_upload


class NotebookViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing personal notebooks.
    
    Features:
    - Create, list, retrieve, update, delete personal notebooks
    - Each user can only access their own notebooks
    - Color validation (must be valid hex color)
    """
    serializer_class = NotebookSerializer
    permission_classes = [permissions.IsAuthenticated, Isuser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Return only notebooks owned by the authenticated user.
        Optimized for performance.
        """
        return Notebook.objects.filter(user=self.request.user).prefetch_related(
            Prefetch('notes', queryset=Note.objects.filter(user=self.request.user))
        )

    def perform_create(self, serializer):
        """Assign the authenticated user as the user."""
        serializer.save(user=self.request.user)


class NoteViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing personal notes.
    
    Features:
    - Create, list, retrieve, update, delete personal notes
    - Filter by notebook, favorites, pinned status, or tags
    - Search by title, content, or tags
    - Toggle favorite and pin status
    - Each user can only access their own notes
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated, Isuser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'is_pinned', 'is_favorite']
    ordering = ['-is_pinned', '-updated_at']

    def get_queryset(self):
        """
        Return only notes owned by the authenticated user.
        Apply filters for notebook, favorites, pinned, and tags.
        Optimized with select_related to avoid N+1 queries.
        """
        queryset = Note.objects.filter(user=self.request.user).select_related('notebook')
        
        # Filter by notebook (with usership validation)
        notebook_id = self.request.query_params.get('notebook', None)
        if notebook_id:
            # Validate that the notebook belongs to the user
            if not Notebook.objects.filter(id=notebook_id, user=self.request.user).exists():
                raise PermissionDenied(
                    "You do not have permission to view notes in this notebook."
                )
            queryset = queryset.filter(notebook_id=notebook_id)
        
        # Filter by favorites
        favorites = self.request.query_params.get('favorites', None)
        if favorites and favorites.lower() == 'true':
            queryset = queryset.filter(is_favorite=True)
        
        # Filter by pinned
        pinned = self.request.query_params.get('pinned', None)
        if pinned and pinned.lower() == 'true':
            queryset = queryset.filter(is_pinned=True)
        
        # Filter by tag
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__contains=[tag])
        
        return queryset

    def perform_create(self, serializer):
        """
        Create a note owned by the authenticated user.
        Validate notebook usership if provided.
        """
        notebook = serializer.validated_data.get('notebook')
        if notebook and notebook.user != self.request.user:
            raise PermissionDenied(
                "You can only add notes to notebooks you own."
            )
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """
        Update a note.
        Validate notebook usership if the notebook is being changed.
        """
        notebook = serializer.validated_data.get('notebook', self.get_object().notebook)
        if notebook and notebook.user != self.request.user:
            raise PermissionDenied(
                "You can only move notes to notebooks you own."
            )
        serializer.save()

    @action(detail=True, methods=['post'], url_path='upload')
    def upload(self, request, pk=None):
        note = self.get_object()
        files = request.FILES.getlist("files")

        if not files:
            return Response({"error": "No files provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_upload_payload(files)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        attachments = []
        for f in files:
            try:
                validate_file_upload(f)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            attachment = NoteAttachment.objects.create(
                note=note,
                file=f,
                original_filename=f.name,
                file_type=f.content_type or "",
                file_size=f.size,
            )
            attachments.append(attachment)

        serializer = NoteAttachmentSerializer(attachments, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """
        Toggle the favorite status of a note.
        
        Returns the updated note object.
        """
        note = self.get_object()
        note.is_favorite = not note.is_favorite
        note.save()
        serializer = self.get_serializer(note)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        """
        Toggle the pin status of a note.
        
        Returns the updated note object.
        """
        note = self.get_object()
        note.is_pinned = not note.is_pinned
        note.save()
        serializer = self.get_serializer(note)
        return Response(serializer.data)