# acumen_backend/announcements/services.py
import logging
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from announcements.models import Announcement, AnnouncementRead
from workspaces.models import TeamMembership, WorkspaceMembership, Team
from notifications.services import NotificationService, AnnouncementEvent

logger = logging.getLogger(__name__)


class AnnouncementService:
    @staticmethod
    @transaction.atomic
    def create_announcement(workspace, creator, data):
        title = (data.get("title") or "").strip()
        content = (data.get("content") or "").strip()
        if not title or not content:
            raise ValueError("Title and content required")

        team_ids = data.get("team_ids", [])
        teams = Team.objects.filter(id__in=team_ids, workspace=workspace)

        expiry_days = data.get("expiry_days", 60)
        expiry_date = None
        if expiry_days and int(expiry_days) > 0:
            expiry_date = timezone.now() + timedelta(days=int(expiry_days))

        ann = Announcement.objects.create(
            title=title,
            content=content,
            priority=data.get("priority", "normal"),
            pinned=data.get("pinned", False),
            created_by=creator,
            workspace=workspace,
            expiry_date=expiry_date,
        )
        if teams.exists():
            ann.teams.add(*teams)

        try:
            if teams.exists():
                member_ids = list(
                    TeamMembership.objects.filter(
                        team__in=teams, is_active=True
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
                    recipient_ids=list(set(member_ids)),
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
    def mark_as_read(announcement: Announcement, user) -> AnnouncementRead:
        read, created = AnnouncementRead.objects.get_or_create(
            announcement=announcement, user=user
        )
        return read
