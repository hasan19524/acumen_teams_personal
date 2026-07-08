"""
URL configuration for the Notes app.

Endpoints:
- /api/notes/notes/              - List, create notes
- /api/notes/notes/{id}/         - Retrieve, update, delete note
- /api/notes/notes/{id}/toggle_favorite/  - Toggle note favorite status
- /api/notes/notes/{id}/toggle_pin/       - Toggle note pin status
- /api/notes/notebooks/          - List, create notebooks
- /api/notes/notebooks/{id}/     - Retrieve, update, delete notebook

Query Parameters:
- /api/notes/notes/?notebook=<id>     - Filter notes by notebook
- /api/notes/notes/?favorites=true    - Filter favorite notes only
- /api/notes/notes/?pinned=true       - Filter pinned notes only
- /api/notes/notes/?tag=<tag>         - Filter notes by tag
- /api/notes/notes/?search=<query>    - Search notes by title, content, tags
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, NotebookViewSet

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'notebooks', NotebookViewSet, basename='notebook')

urlpatterns = [
    path('', include(router.urls)),
]