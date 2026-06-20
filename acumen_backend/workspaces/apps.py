# acumen_backend/workspaces/apps.py
from django.apps import AppConfig


class WorkspacesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "workspaces"

    # The ready() method and signal import have been removed
    # because business logic now lives in services.py
