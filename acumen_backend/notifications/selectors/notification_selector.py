from typing import Optional, List
from django.contrib.auth.models import User
from workspaces.models import Workspace
from notifications.models import Notification


def get_unread_notifications(
    user: User, workspace: Optional[Workspace] = None
) -> List[Notification]:
    qs = Notification.objects.filter(recipient=user, status="unread")
    if workspace:
        qs = qs.filter(workspace=workspace)
    return list(qs)


def get_unread_count(user: User, workspace: Optional[Workspace] = None) -> int:
    qs = Notification.objects.filter(recipient=user, status="unread")
    if workspace:
        qs = qs.filter(workspace=workspace)
    return qs.count()


def get_recent_notifications(
    user: User, workspace: Workspace, limit: int = 50
) -> List[Notification]:
    qs = Notification.objects.filter(recipient=user, workspace=workspace).order_by(
        "-created_at"
    )
    return list(qs[:limit])
