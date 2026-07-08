from django.apps import AppConfig


class NotesConfig(AppConfig):
    """
    Django app configuration for the Notes application.
    
    Provides:
    - Personal notebook management
    - Personal note creation and organization
    - Note tagging, favoriting, and pinning
    - Full-text search across notes
    
    This app is completely isolated and does not integrate with
    Workspaces, Teams, Chat, Tasks, Notifications, or Attendance.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notes'