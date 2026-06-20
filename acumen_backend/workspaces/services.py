# acumen_backend/workspaces/services.py
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Workspace, Team, TeamMembership, WorkspaceMembership, TeamType


class WorkspaceService:
    @staticmethod
    @transaction.atomic
    def create_workspace(name, owner, slug=None):
        from django.utils.text import slugify
        from chat.models import Channel, ChannelMember

        if not slug:
            slug = slugify(name)

        workspace = Workspace.objects.create(name=name, slug=slug, owner=owner)
        WorkspaceMembership.objects.create(
            workspace=workspace, user=owner, role="owner"
        )

        # 1. Create System Teams
        general = Team.objects.create(
            workspace=workspace, name="General", team_type=TeamType.GENERAL
        )
        management = Team.objects.create(
            workspace=workspace, name="Management", team_type=TeamType.MANAGEMENT
        )
        unassigned = Team.objects.create(
            workspace=workspace, name="Unassigned", team_type=TeamType.UNASSIGNED
        )
        workspace.unassigned_team = unassigned
        workspace.save()

        TeamMembership.objects.create(team=general, user=owner)
        TeamMembership.objects.create(team=management, user=owner)

        # 2. Create System Chats (Organization -> Communication)
        general_chat = Channel.objects.create(
            name="General",
            slug=f"general-{workspace.id}",
            channel_type="official",
            workspace=workspace,
            created_by=owner,
        )
        ChannelMember.objects.create(channel=general_chat, user=owner, role="admin")

        mgmt_chat = Channel.objects.create(
            name="Management",
            slug=f"management-{workspace.id}",
            channel_type="official",
            workspace=workspace,
            created_by=owner,
        )
        ChannelMember.objects.create(channel=mgmt_chat, user=owner, role="admin")

        return workspace

    @staticmethod
    @transaction.atomic
    def join_workspace(workspace, user, role="member", invited_by=None):
        from chat.models import Channel, ChannelMember

        membership, created = WorkspaceMembership.objects.update_or_create(
            workspace=workspace,
            user=user,
            defaults={
                "role": role,
                "is_active": True,
                "invited_by": invited_by,
                "left_at": None,
            },
        )

        unassigned = Team.objects.get(
            workspace=workspace, team_type=TeamType.UNASSIGNED
        )
        TeamMembership.objects.update_or_create(
            team=unassigned,
            user=user,
            defaults={"is_active": True, "is_leader": False, "left_at": None},
        )

        # Synchronize General Chat
        general_chat = Channel.objects.get(slug=f"general-{workspace.id}")
        ChannelMember.objects.update_or_create(
            channel=general_chat,
            user=user,
            defaults={"role": "member", "is_active": True, "left_at": None},
        )

        return membership

    @staticmethod
    @transaction.atomic
    def leave_workspace(workspace, user):
        from chat.models import ChannelMember

        WorkspaceMembership.objects.filter(workspace=workspace, user=user).update(
            is_active=False, left_at=timezone.now()
        )
        TeamMembership.objects.filter(
            user=user, team__workspace=workspace, is_active=True
        ).update(is_active=False, left_at=timezone.now())

        # Synchronize ALL channel departures
        ChannelMember.objects.filter(
            user=user, channel__workspace=workspace, is_active=True
        ).update(is_active=False, left_at=timezone.now())


class TeamService:
    @staticmethod
    @transaction.atomic
    def create_team(workspace, name, creator):
        from chat.models import Channel, ChannelMember

        team = Team.objects.create(
            workspace=workspace, name=name, team_type=TeamType.STANDARD
        )

        # Organization -> Communication sync owned by Service
        channel = Channel.objects.create(
            name=f"{team.name}",
            slug=f"team-{team.id}-{name.lower().replace(' ', '-')}",
            channel_type="team",
            workspace=workspace,
            team=team,
            created_by=creator,
        )
        return team

    @staticmethod
    @transaction.atomic
    def delete_team(team):
        from chat.models import Channel

        Channel.objects.filter(team=team).delete()
        team.delete()

    @staticmethod
    @transaction.atomic
    def add_member(team, user):
        from chat.models import Channel, ChannelMember

        TeamMembership.objects.update_or_create(
            team=team, user=user, defaults={"is_active": True, "left_at": None}
        )

        # Remove from Unassigned
        unassigned = Team.objects.get(
            workspace=team.workspace, team_type=TeamType.UNASSIGNED
        )
        TeamMembership.objects.filter(
            team=unassigned, user=user, is_active=True
        ).update(is_active=False, left_at=timezone.now())

        # Synchronize Team Chat
        team_channel = Channel.objects.get(team=team, channel_type="team")
        ChannelMember.objects.update_or_create(
            channel=team_channel,
            user=user,
            defaults={"role": "member", "is_active": True, "left_at": None},
        )

    @staticmethod
    @transaction.atomic
    def remove_member(team, user):
        from chat.models import Channel, ChannelMember

        TeamMembership.objects.filter(team=team, user=user, is_active=True).update(
            is_active=False, left_at=timezone.now()
        )

        # Synchronize Team Chat
        team_channel = Channel.objects.get(team=team, channel_type="team")
        ChannelMember.objects.filter(
            channel=team_channel, user=user, is_active=True
        ).update(is_active=False, left_at=timezone.now())

        # Check if user has 0 active teams, add to Unassigned
        active_teams = TeamMembership.objects.filter(
            user=user, team__workspace=team.workspace, is_active=True
        ).count()
        if active_teams == 0:
            unassigned = Team.objects.get(
                workspace=team.workspace, team_type=TeamType.UNASSIGNED
            )
            TeamMembership.objects.update_or_create(
                team=unassigned,
                user=user,
                defaults={"is_active": True, "is_leader": False, "left_at": None},
            )

    @staticmethod
    @transaction.atomic
    def promote_leader(team, user):
        from chat.models import Channel, ChannelMember

        TeamMembership.objects.update_or_create(
            team=team,
            user=user,
            defaults={"is_active": True, "is_leader": True, "left_at": None},
        )

        # Add to Management Team
        management = Team.objects.get(
            workspace=team.workspace, team_type=TeamType.MANAGEMENT
        )
        TeamMembership.objects.update_or_create(
            team=management, user=user, defaults={"is_active": True, "left_at": None}
        )

        # Synchronize Management Chat
        mgmt_chat = Channel.objects.get(slug=f"management-{team.workspace.id}")
        ChannelMember.objects.update_or_create(
            channel=mgmt_chat,
            user=user,
            defaults={"role": "admin", "is_active": True, "left_at": None},
        )

    @staticmethod
    @transaction.atomic
    def demote_leader(team, user):
        from chat.models import Channel, ChannelMember

        TeamMembership.objects.filter(team=team, user=user, is_active=True).update(
            is_leader=False
        )

        still_leads = TeamMembership.objects.filter(
            user=user, team__workspace=team.workspace, is_leader=True, is_active=True
        ).exists()

        if not still_leads:
            management = Team.objects.get(
                workspace=team.workspace, team_type=TeamType.MANAGEMENT
            )
            TeamMembership.objects.filter(
                team=management, user=user, is_active=True
            ).update(is_active=False, left_at=timezone.now())

            mgmt_chat = Channel.objects.get(slug=f"management-{team.workspace.id}")
            ChannelMember.objects.filter(
                channel=mgmt_chat, user=user, is_active=True
            ).update(is_active=False, left_at=timezone.now())
