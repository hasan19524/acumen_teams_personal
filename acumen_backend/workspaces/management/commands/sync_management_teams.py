from django.core.management.base import BaseCommand
from django.utils import timezone
from workspaces.models import (
    Workspace,
    Team,
    TeamType,
    TeamMembership,
    WorkspaceMembership,
)
from chat.models import Channel, ChannelMember


class Command(BaseCommand):
    help = "Syncs Management team and chat memberships for all users based on the new SSOT rules."

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING("Starting Management Team synchronization...")
        )

        for ws in Workspace.objects.all():
            self.stdout.write(f"Processing Workspace: {ws.name} (ID: {ws.id})")

            # 1. Get or create Management Team
            management_team, _ = Team.objects.get_or_create(
                workspace=ws,
                team_type=TeamType.MANAGEMENT,
                defaults={"name": "Management"},
            )

            # 2. Get or create Management Chat
            mgmt_chat, _ = Channel.objects.get_or_create(
                slug=f"management-{ws.id}",
                defaults={
                    "name": "Management",
                    "channel_type": "official",
                    "workspace": ws,
                    "team": management_team,
                    "created_by": ws.owner,
                },
            )

            # 3. Sync all active members in this workspace
            memberships = WorkspaceMembership.objects.filter(
                workspace=ws, is_active=True
            )

            for membership in memberships:
                user = membership.user
                is_owner = membership.role == "owner"
                is_admin = membership.role == "admin"

                # Check if they are a leader of ANY standard team
                is_team_leader = TeamMembership.objects.filter(
                    user=user, team__workspace=ws, is_leader=True, is_active=True
                ).exists()

                # They should be in Management if they are Owner, Admin, or a Team Leader
                should_be_in_mgmt = is_owner or is_admin or is_team_leader

                # Update Team Membership (ONLY owner is_leader=True)
                TeamMembership.objects.update_or_create(
                    team=management_team,
                    user=user,
                    defaults={
                        "is_active": should_be_in_mgmt,
                        "left_at": None if should_be_in_mgmt else timezone.now(),
                        "is_leader": is_owner,
                    },
                )

                # Update Chat Membership
                ChannelMember.objects.update_or_create(
                    channel=mgmt_chat,
                    user=user,
                    defaults={
                        "role": "admin" if (is_owner or is_admin) else "member",
                        "is_active": should_be_in_mgmt,
                        "left_at": None if should_be_in_mgmt else timezone.now(),
                    },
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Synchronization complete! All Management teams are now clean."
            )
        )
