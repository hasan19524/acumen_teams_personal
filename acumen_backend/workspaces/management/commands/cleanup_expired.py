# acumen_backend/workspaces/management/commands/cleanup_expired.py

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Cleanup expired invites, DM requests, and pending groups. Run via cron or scheduler."

    def handle(self, *args, **options):
        now = timezone.now()
        results = {}

        # 1. Expire pending DM requests past their expiry
        try:
            from chat.models import DMRequest

            dm_expired = DMRequest.objects.filter(
                status="pending", expires_at__lte=now
            ).update(status="expired")
            results["dm_requests_expired"] = dm_expired
        except Exception as e:
            results["dm_requests_error"] = str(e)

        # 2. Expire active workspace invites past their expiry
        try:
            from workspaces.models import WorkspaceInvite

            ws_expired = WorkspaceInvite.objects.filter(
                status="active", expires_at__lte=now
            ).update(status="expired")
            results["workspace_invites_expired"] = ws_expired
        except Exception as e:
            results["workspace_invites_error"] = str(e)

        # 3. Expire pending team invites past their expiry
        try:
            from workspaces.models import TeamInvite

            ti_expired = TeamInvite.objects.filter(
                status="pending", expires_at__lte=now
            ).update(status="expired")
            results["team_invites_expired"] = ti_expired
        except Exception as e:
            results["team_invites_error"] = str(e)

        # 4. Expire pending private group invites past their expiry
        try:
            from workspaces.models import PrivateGroupInvite

            gi_expired = PrivateGroupInvite.objects.filter(
                status="pending", expires_at__lte=now
            ).update(status="expired")
            results["group_invites_expired"] = gi_expired
        except Exception as e:
            results["group_invites_error"] = str(e)

        # 5. Delete pending private groups older than 24h with < 2 members
        try:
            from chat.models import Channel, ChannelMember
            from workspaces.models import PrivateGroupInvite
            from notifications.services import NotificationService, WorkspaceEvent

            cutoff = now - __import__("datetime").timedelta(hours=24)
            pending_groups = Channel.objects.filter(
                channel_type="private_group",
                is_pending=True,
                created_at__lte=cutoff,
            )

            deleted_groups = []
            for group in pending_groups:
                active_count = ChannelMember.objects.filter(
                    channel=group, is_active=True
                ).count()
                if active_count < 2:
                    # Notify owner before deleting
                    try:
                        NotificationService.create_and_emit(
                            WorkspaceEvent(
                                actor_id=group.owner_id or 1,
                                workspace_id=group.workspace_id,
                                event_description=f"Group '{group.name}' was deleted: not enough members joined within 24 hours.",
                                member_ids=[group.owner_id] if group.owner_id else [],
                            )
                        )
                    except Exception:
                        pass

                    # Delete related invites first
                    PrivateGroupInvite.objects.filter(channel=group).delete()
                    group.delete()
                    deleted_groups.append(group.name)

            results["pending_groups_deleted"] = len(deleted_groups)
        except Exception as e:
            results["pending_groups_error"] = str(e)

        # 6. Process DM request cooldowns (rejected requests past undo window)
        try:
            from chat.models import DMRequest
            from datetime import timedelta

            # Rejected requests older than 24h: cooldown is already set.
            # No action needed — cooldown_until field handles this.
            # Just count for reporting.
            cooldown_active = DMRequest.objects.filter(
                status="rejected",
                cooldown_until__gt=now,
            ).count()
            results["dm_cooldown_active"] = cooldown_active
        except Exception as e:
            results["dm_cooldown_error"] = str(e)

        self.stdout.write(self.style.SUCCESS(f"Cleanup results: {results}"))
