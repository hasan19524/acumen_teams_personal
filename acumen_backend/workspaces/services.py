# acumen_backend/workspaces/services.py

from django.db import transaction, IntegrityError
from django.utils import timezone
from django.utils.text import slugify
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from .models import Workspace, Team, TeamMembership, WorkspaceMembership, TeamType


def generate_unique_workspace_slug(name: str) -> str:
    """
    Generates a unique slug for a workspace.
    If 'acumen-teams' exists, returns 'acumen-teams-2', etc.
    """
    base_slug = slugify(name) or "workspace"
    slug = base_slug
    counter = 2

    while Workspace.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


class WorkspaceService:

    @staticmethod
    @transaction.atomic
    def sync_management_team_membership(workspace, user):
        """
        Ensures a user is in the Management team and chat if they are an admin/owner or a team leader.
        If they lose all leadership and admin roles, they are removed from the Management team and chat.
        """
        from chat.models import Channel, ChannelMember

        management, _ = Team.objects.get_or_create(
            workspace=workspace, 
            team_type=TeamType.MANAGEMENT, 
            defaults={"name": "Management"}
        )
        mgmt_chat, _ = Channel.objects.get_or_create(
            slug=f"management-{workspace.id}",
            defaults={
                "name": "Management",
                "channel_type": "official",
                "workspace": workspace,
                "team": management,
                "created_by": workspace.owner
            }
        )

        ws_membership = WorkspaceMembership.objects.filter(
            user=user, workspace=workspace, is_active=True
        ).first()
        is_owner = ws_membership and ws_membership.role == "owner"
        is_admin = ws_membership and ws_membership.role == "admin"
        
        is_team_leader = TeamMembership.objects.filter(
            user=user, team__workspace=workspace, is_leader=True, is_active=True
        ).exists()

        should_be_in_mgmt = is_owner or is_admin or is_team_leader

        # SSOT FIX: ONLY the workspace owner is the leader of the Management team
        TeamMembership.objects.update_or_create(
            team=management, user=user,
            defaults={
                "is_active": should_be_in_mgmt, 
                "left_at": None if should_be_in_mgmt else timezone.now(),
                "is_leader": is_owner
            }
        )

        # Sync Chat Membership
        ChannelMember.objects.update_or_create(
            channel=mgmt_chat, user=user,
            defaults={
                "role": "admin" if (is_owner or is_admin) else "member", 
                "is_active": should_be_in_mgmt, 
                "left_at": None if should_be_in_mgmt else timezone.now()
            }
        )

    @staticmethod
    def create_workspace(name, owner, slug=None):
        from chat.models import Channel, ChannelMember

        max_retries = 10

        for attempt in range(max_retries):
            try:
                with transaction.atomic():
                    # 1. Generate the unique slug
                    if not slug:
                        slug = generate_unique_workspace_slug(name)

                    # 2. Create the workspace
                    workspace = Workspace.objects.create(
                        name=name, slug=slug, owner=owner
                    )
                    WorkspaceMembership.objects.create(
                        workspace=workspace, user=owner, role="owner"
                    )

                    # 1. Create System Teams
                    general = Team.objects.create(
                        workspace=workspace, name="General", team_type=TeamType.GENERAL
                    )
                    management = Team.objects.create(
                        workspace=workspace,
                        name="Management",
                        team_type=TeamType.MANAGEMENT,
                    )
                    unassigned = Team.objects.create(
                        workspace=workspace,
                        name="Unassigned",
                        team_type=TeamType.UNASSIGNED,
                    )
                    workspace.unassigned_team = unassigned
                    workspace.save()

                    TeamMembership.objects.create(
                        team=general, user=owner, is_active=True
                    )
                    TeamMembership.objects.create(
                        team=management, user=owner, is_active=True, is_leader=True
                    )
                    # FIX: Add owner to Unassigned team so they can see the Unassigned chat
                    TeamMembership.objects.create(
                        team=unassigned, user=owner, is_active=True
                    )

                    # 2. Create System Chats (Organization -> Communication)
                    general_chat = Channel.objects.create(
                        name="General",
                        slug=f"general-{workspace.id}",
                        channel_type="official",
                        workspace=workspace,
                        team=general,  # CRITICAL FIX: Link the channel to the General team
                        created_by=owner,
                    )
                    ChannelMember.objects.create(
                        channel=general_chat, user=owner, role="admin"
                    )

                    mgmt_chat = Channel.objects.create(
                        name="Management",
                        slug=f"management-{workspace.id}",
                        channel_type="official",
                        workspace=workspace,
                        team=management,  # CRITICAL FIX: Link the channel to the Management team
                        created_by=owner,
                    )
                    ChannelMember.objects.create(
                        channel=mgmt_chat, user=owner, role="admin"
                    )

                    # 3. Create Unassigned Team Chat (So it shows up in the Chat Sidebar)
                    unassigned_chat = Channel.objects.create(
                        name="Unassigned",
                        slug=f"unassigned-{workspace.id}",
                        channel_type="team",
                        workspace=workspace,
                        team=unassigned,  # Link to the Unassigned team
                        created_by=owner,
                    )
                    ChannelMember.objects.create(
                        channel=unassigned_chat, user=owner, role="admin"
                    )

                    return workspace

            except IntegrityError:
                # 3. Handle race conditions
                # If another request inserted the exact same slug between our
                # .exists() check and .create(), Postgres throws IntegrityError.
                if attempt < max_retries - 1:
                    # Force slug regeneration on the next attempt
                    slug = None
                    continue
                else:
                    raise ValidationError(
                        {
                            "detail": "Could not generate a unique workspace slug after multiple attempts. Please try a different name."
                        }
                    )

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
        general_team = Team.objects.get(workspace=workspace, team_type=TeamType.GENERAL)
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
            },
        )
        ChannelMember.objects.update_or_create(
            channel=general_chat,
            user=user,
            defaults={"role": "member", "is_active": True, "left_at": None},
        )

        # Synchronize Unassigned Chat
        unassigned_chat, _ = Channel.objects.get_or_create(
            slug=f"unassigned-{workspace.id}",
            defaults={
                "name": "Unassigned",
                "channel_type": "team",
                "workspace": workspace,
                "team": unassigned,
                "created_by": workspace.owner,
            },
        )
        ChannelMember.objects.update_or_create(
            channel=unassigned_chat,
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
                workspace=workspace, approved_by=user, status="pending_approval"
            )
            if pending_approvals.exists():
                pending_approvals.update(approved_by=workspace.owner)

            # 2. Reassign Active Assigned Tasks (Not completed/archived)
            active_assigned_tasks = Task.objects.filter(
                workspace=workspace,
                assigned_to=user,
                status__in=[
                    "todo",
                    "in_progress",
                    "review",
                ],  # Adjust statuses as needed
            )
            if active_assigned_tasks.exists():
                active_assigned_tasks.update(assigned_to=workspace.owner)

            # 3. Reassign Team Leadership
            led_teams = TeamMembership.objects.filter(
                user=user, team__workspace=workspace, is_active=True, is_leader=True
            )
            for tm in led_teams:
                # Ensure owner is a member of the team first
                owner_membership, _ = TeamMembership.objects.get_or_create(
                    team=tm.team, user=workspace.owner, defaults={"is_active": True}
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

        # FIX: Automatically sync Management team status (will remove if no longer admin/leader)
        WorkspaceService.sync_management_team_membership(team.workspace, user)

        # Check if user has 0 active standard teams, add to Unassigned
        active_teams = TeamMembership.objects.filter(
            user=user,
            team__workspace=team.workspace,
            is_active=True,
            team__team_type=TeamType.STANDARD,
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
        
        # FIX: Automatically add leaders to the Management team and chat
        WorkspaceService.sync_management_team_membership(team.workspace, user)

    @staticmethod
    @transaction.atomic
    def demote_leader(team, user):
        from chat.models import Channel, ChannelMember

        TeamMembership.objects.filter(team=team, user=user, is_active=True).update(
            is_leader=False
        )

        # FIX: Automatically sync Management team status (will remove if no longer admin/leader)
        WorkspaceService.sync_management_team_membership(team.workspace, user)