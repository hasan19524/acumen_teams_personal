# acumen_backend/announcements/services.py
import logging
from django.db import transaction
from django.utils import timezone

from announcements.models import Announcement
from workspaces.models import TeamMembership, WorkspaceMembership
from notifications.services import NotificationService, AnnouncementEvent

logger = logging.getLogger(__name__)


class AnnouncementService:
    """
    Centralized service for all announcement state mutations.
    """

    @staticmethod
    @transaction.atomic
    def create_announcement(workspace, creator, data):
        title = (data.get("title") or "").strip()
        content = (data.get("content") or "").strip()

        if not title or not content:
            raise ValueError("Title and content required")

        team_id = data.get("team_id")
        team = None
        if team_id:
            from workspaces.models import Team

            team = Team.objects.get(id=team_id, workspace=workspace)

        ann = Announcement.objects.create(
            title=title,
            content=content,
            tag=data.get("tag", "General"),
            priority=data.get("priority", "Normal"),
            pinned=data.get("pinned", False),
            created_by=creator,
            workspace=workspace,
            team=team,
        )

        # Route notifications to correct recipients
        try:
            if team:
                member_ids = list(
                    TeamMembership.objects.filter(
                        team=team, is_active=True
                    ).values_list("user_id", flat=True)
                )
            else:
                member_ids = list(
                    WorkspaceMembership.objects.filter(
                        workspace=workspace, is_active=True
                    ).values_list("user_id", flat=True)
                )

            NotificationService.create_and_emit(
                AnnouncementEvent(
                    actor_id=creator.id,
                    workspace_id=workspace.id,
                    announcement_id=ann.id,
                    announcement_title=title,
                    recipient_ids=member_ids,
                )
            )
        except Exception as e:
            logger.warning(f"Failed to emit AnnouncementEvent: {e}")

        return ann

    @staticmethod
    @transaction.atomic
    def delete_announcement(announcement):
        announcement.is_deleted = True
        announcement.deleted_at = timezone.now()
        announcement.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
        return announcement

    @staticmethod
    @transaction.atomic
    def mark_as_read(announcement, user):
        from announcements.models import AnnouncementRead

        read, created = AnnouncementRead.objects.get_or_create(
            announcement=announcement, user=user
        )
        return read
