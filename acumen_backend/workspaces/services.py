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

        TeamMembership.objects.create(team=general, user=owner, is_active=True)
        TeamMembership.objects.create(team=management, user=owner, is_active=True, is_leader=True)

        # 2. Create System Chats (Organization -> Communication)
        general_chat = Channel.objects.create(
            name="General",
            slug=f"general-{workspace.id}",
            channel_type="official",
            workspace=workspace,
            team=general,  # CRITICAL FIX: Link the channel to the General team
            created_by=owner,
        )
        ChannelMember.objects.create(channel=general_chat, user=owner, role="admin")

        mgmt_chat = Channel.objects.create(
            name="Management",
            slug=f"management-{workspace.id}",
            channel_type="official",
            workspace=workspace,
            team=management,  # CRITICAL FIX: Link the channel to the Management team
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

        # CRITICAL FIX: Ensure all members are added to the "General" team
        general_team = Team.objects.get(
            workspace=workspace, team_type=TeamType.GENERAL
        )
        TeamMembership.objects.update_or_create(
            team=general_team,
            user=user,
            defaults={"is_active": True, "is_leader": False, "left_at": None},
        )

        # Synchronize General Chat
        general_chat, _ = Channel.objects.get_or_create(
            slug=f"general-{workspace.id}",
            defaults={
                "name": "General",
                "channel_type": "official",
                "workspace": workspace,
                "created_by": workspace.owner,
            }
        )
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
        from tasks.models import Task
        from notifications.services import NotificationService, WorkspaceEvent

        # ── Phase 2: Reassign Active Responsibilities ──────────────────────
        # Prevent orphaned tasks or approvals when a user leaves.
        if workspace.owner != user:
            
            # 1. Reassign Pending Approvals
            pending_approvals = Task.objects.filter(
                workspace=workspace,
                approved_by=user,
                status="pending_approval"
            )
            if pending_approvals.exists():
                pending_approvals.update(approved_by=workspace.owner)

            # 2. Reassign Active Assigned Tasks (Not completed/archived)
            active_assigned_tasks = Task.objects.filter(
                workspace=workspace,
                assigned_to=user,
                status__in=["todo", "in_progress", "review"] # Adjust statuses as needed
            )
            if active_assigned_tasks.exists():
                active_assigned_tasks.update(assigned_to=workspace.owner)

            # 3. Reassign Team Leadership
            led_teams = TeamMembership.objects.filter(
                user=user, 
                team__workspace=workspace, 
                is_active=True, 
                is_leader=True
            )
            for tm in led_teams:
                # Ensure owner is a member of the team first
                owner_membership, _ = TeamMembership.objects.get_or_create(
                    team=tm.team, user=workspace.owner,
                    defaults={"is_active": True}
                )
                owner_membership.is_leader = True
                owner_membership.is_active = True
                owner_membership.save()
                
                try:
                    NotificationService.create_and_emit(
                        WorkspaceEvent(
                            actor_id=user.id,
                            workspace_id=workspace.id,
                            event_description=f"You have inherited leadership of team {tm.team.name} from {user.username}.",
                            member_ids=[workspace.owner.id],
                        )
                    )
                except Exception:
                    pass

        # ── Deactivate Memberships ─────────────────────────────────────────
        WorkspaceMembership.objects.filter(workspace=workspace, user=user).update(
            is_active=False, left_at=timezone.now()
        )
        
        # Explicitly strip leadership when leaving to prevent orphan leader counts
        TeamMembership.objects.filter(
            user=user, team__workspace=workspace, is_active=True
        ).update(is_active=False, is_leader=False, left_at=timezone.now())

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

        # 1. Move all active members to "Unassigned" before deleting the team
        unassigned = Team.objects.get(
            workspace=team.workspace, team_type=TeamType.UNASSIGNED
        )
        
        active_memberships = TeamMembership.objects.filter(team=team, is_active=True)
        for membership in active_memberships:
            # Add to Unassigned (update_or_create in case they are already there but inactive)
            TeamMembership.objects.update_or_create(
                team=unassigned,
                user=membership.user,
                defaults={"is_active": True, "is_leader": False, "left_at": None},
            )

        # 2. Synchronize Chat: Delete associated team channels
        Channel.objects.filter(team=team).delete()
        
        # 3. Delete the team (this cascades and deletes the old TeamMembership records)
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

        # Deactivate membership in the specific team and strip leadership
        TeamMembership.objects.filter(team=team, user=user, is_active=True).update(
            is_active=False, is_leader=False, left_at=timezone.now()
        )

        # Synchronize Team Chat
        team_channel = Channel.objects.get(team=team, channel_type="team")
        ChannelMember.objects.filter(
            channel=team_channel, user=user, is_active=True
        ).update(is_active=False, left_at=timezone.now())

        # Check if user still leads any other teams
        still_leads = TeamMembership.objects.filter(
            user=user, team__workspace=team.workspace, is_leader=True, is_active=True
        ).exists()

        if not still_leads:
            # Remove from Management team and chat
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

        # Check if user has 0 active standard teams, add to Unassigned
        active_teams = TeamMembership.objects.filter(
            user=user, team__workspace=team.workspace, is_active=True, team__team_type=TeamType.STANDARD
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

        # Demote all current leaders of this team (except the new leader)
        TeamMembership.objects.filter(
            team=team, is_leader=True, is_active=True
        ).exclude(user=user).update(is_leader=False)

        TeamMembership.objects.update_or_create(
            team=team,
            user=user,
            defaults={"is_active": True, "is_leader": True, "left_at": None},
        )

        # Add to Management Team (Use get_or_create to prevent 500 errors on legacy workspaces)
        management, _ = Team.objects.get_or_create(
            workspace=team.workspace, 
            team_type=TeamType.MANAGEMENT,
            defaults={"name": "Management"}
        )
        TeamMembership.objects.update_or_create(
            team=management, user=user, defaults={"is_active": True, "left_at": None}
        )

        # Synchronize Management Chat
        mgmt_chat, _ = Channel.objects.get_or_create(
            slug=f"management-{team.workspace.id}",
            defaults={
                "name": "Management",
                "channel_type": "official",
                "workspace": team.workspace,
                "created_by": user
            }
        )
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
