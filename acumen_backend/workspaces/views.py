from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from django.utils import timezone
from datetime import timedelta
from django.db import models

from .models import (
    Workspace,
    Team,
    WorkspaceMembership,
    WorkspaceInvite,
    TeamMembership,
    TeamInvite,
    PrivateGroupInvite,
    ROLE_PERMISSIONS,
)
from .permissions import require_permission
from notifications.services import NotificationService, WorkspaceEvent
import logging

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_workspace(request):
    try:
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=404)
        workspace = membership.workspace
        return Response(
            {
                "id": workspace.id,
                "name": workspace.name,
                "slug": workspace.slug,
                "owner": workspace.owner.username,
            }
        )
    except:
        return Response({"error": "No workspace found"}, status=404)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_team(request):
    try:
        team_membership = (
            TeamMembership.objects.filter(user=request.user, is_active=True)
            .select_related("team__leader")
            .first()
        )

        if not team_membership:
            return Response({"team": None})

        team = team_membership.team
        members = TeamMembership.objects.filter(
            team=team, is_active=True
        ).select_related("user")

        return Response(
            {
                "id": team.id,
                "name": team.name,
                "leader": team.leader.username if team.leader else None,
                "members": [
                    {
                        "user_id": m.user.id,
                        "username": m.user.username,
                        "full_name": f"{m.user.first_name} {m.user.last_name}".strip()
                        or m.user.username,
                        "role": WorkspaceMembership.objects.filter(
                            user=m.user, is_active=True
                        )
                        .values_list("role", flat=True)
                        .first()
                        or "employee",
                    }
                    for m in members
                ],
            }
        )
    except:
        return Response({"team": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_teams(request):
    try:
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "Not authorized"}, status=403)

        if membership.role not in ("owner", "admin", "manager"):
            return Response({"error": "Not authorized"}, status=403)

        workspace = membership.workspace
        teams = Team.objects.filter(workspace=workspace)

        return Response(
            [
                {
                    "id": t.id,
                    "name": t.name,
                    "leader": t.leader.username if t.leader else None,
                    "member_count": TeamMembership.objects.filter(
                        team=t, is_active=True
                    ).count(),
                }
                for t in teams
            ]
        )
    except:
        return Response([])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def workspace_members(request):
    try:
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "Not authorized"}, status=403)

        if membership.role not in ("owner", "admin"):
            return Response({"error": "Not authorized"}, status=403)

        workspace = membership.workspace
        members = WorkspaceMembership.objects.filter(
            workspace=workspace, is_active=True
        ).select_related("user")

        return Response(
            [
                {
                    "user_id": m.user.id,
                    "username": m.user.username,
                    "full_name": f"{m.user.first_name} {m.user.last_name}".strip()
                    or m.user.username,
                    "role": m.role,
                    "team": TeamMembership.objects.filter(user=m.user, is_active=True)
                    .values_list("team__name", flat=True)
                    .first(),
                }
                for m in members
            ]
        )
    except:
        return Response([])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    try:
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"total_members": 0, "total_teams": 0, "role": "employee"})

        workspace = membership.workspace
        total_members = WorkspaceMembership.objects.filter(
            workspace=workspace, is_active=True
        ).count()
        total_teams = Team.objects.filter(workspace=workspace).count()

        return Response(
            {
                "total_members": total_members,
                "total_teams": total_teams,
                "role": membership.role,
            }
        )
    except:
        return Response({"total_members": 0, "total_teams": 0, "role": "employee"})


class CreateTeamView(APIView):
    """
    POST /api/workspaces/teams/create/
    Create a new team in the workspace. Admin/Owner only.
    Body: { "name": "...", "leader_id": <int> (optional) }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        if membership.role not in ("owner", "admin"):
            return Response({"error": "Admin access required"}, status=403)

        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Team name required"}, status=400)

        if Team.objects.filter(name=name, workspace=membership.workspace).exists():
            return Response(
                {"error": "A team with this name already exists"}, status=400
            )

        leader_id = request.data.get("leader_id")
        leader = None

        if leader_id:
            leader_membership = WorkspaceMembership.objects.filter(
                user_id=leader_id, workspace=membership.workspace, is_active=True
            ).first()
            if not leader_membership:
                return Response({"error": "Leader not found in workspace"}, status=404)
            leader = leader_membership.user
            # Promote to manager role
            leader_membership.role = "manager"
            leader_membership.save()

        team = Team.objects.create(
            workspace=membership.workspace,
            name=name,
            leader=leader,
        )

        if leader:
            TeamMembership.objects.update_or_create(
                team=team,
                user=leader,
                defaults={"is_active": True, "left_at": None, "is_leader": True},
            )

        # Team chat channel is auto-created by the post_save signal
        # in workspaces/signals.py with channel_type="team".
        # Do NOT create a channel here — that causes duplicate channels.

        return Response(
            {
                "id": team.id,
                "name": team.name,
                "leader": leader.username if leader else None,
            },
            status=201,
        )


class InviteMemberView(APIView):
    """
    POST /api/workspaces/invite/
    Adds an existing user (by username or email) to this workspace.
    Body: { "username": "...", "role": "employee"|"manager", "team_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.contrib.auth.models import User

        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        if membership.role not in ("owner", "admin"):
            return Response({"error": "Admin access required"}, status=403)

        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        role = request.data.get("role", "employee")
        team_id = request.data.get("team_id")

        if role not in ("employee", "manager", "admin", "guest"):
            return Response(
                {"error": "role must be employee, manager, admin, or guest"}, status=400
            )

        target_user = None
        if username:
            try:
                target_user = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({"error": f"User '{username}' not found"}, status=404)
        elif email:
            try:
                target_user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": f"No user with email '{email}'"}, status=404)
        else:
            return Response({"error": "username or email required"}, status=400)

        # Check already a member
        existing = WorkspaceMembership.objects.filter(
            user=target_user, workspace=membership.workspace
        ).first()

        if existing:
            if existing.is_active:
                return Response(
                    {"error": "User is already in this workspace"}, status=400
                )
            else:
                existing.is_active = True
                existing.role = role
                existing.save()
                return Response(
                    {
                        "detail": "Member re-activated",
                        "user_id": target_user.id,
                        "username": target_user.username,
                        "role": role,
                    },
                    status=200,
                )

        # Resolve team
        team = None
        if team_id:
            try:
                team = Team.objects.get(id=team_id, workspace=membership.workspace)
            except Team.DoesNotExist:
                return Response({"error": "Team not found"}, status=404)

        WorkspaceMembership.objects.create(
            workspace=membership.workspace,
            user=target_user,
            role=role,
            invited_by=request.user,
        )

        if team:
            TeamMembership.objects.update_or_create(
                team=team,
                user=target_user,
                defaults={"is_active": True, "left_at": None},
            )

            # Auto-join team chat channel
            try:
                from chat.models import Channel, ChannelMember

                team_channel = Channel.objects.filter(
                    team=team, channel_type="team"
                ).first()

                if team_channel:
                    ChannelMember.objects.update_or_create(
                        channel=team_channel,
                        user=target_user,
                        defaults={"role": "member", "is_active": True, "left_at": None},
                    )
            except Exception as e:
                logger.warning(f"Failed to add member to team chat: {e}")

        # Notify workspace members about the new member
        try:
            member_ids = list(
                WorkspaceMembership.objects.filter(
                    workspace=membership.workspace, is_active=True
                ).values_list("user_id", flat=True)
            )
            NotificationService.create_and_emit(
                WorkspaceEvent(
                    actor_id=request.user.id,
                    workspace_id=membership.workspace.id,
                    event_description=f"{target_user.username} joined the workspace",
                    member_ids=member_ids,
                )
            )
        except Exception as e:
            logger.warning(f"Failed to emit WorkspaceEvent (member added): {e}")

        return Response(
            {
                "detail": "Member added successfully",
                "user_id": target_user.id,
                "username": target_user.username,
                "role": role,
            },
            status=201,
        )


class UpdateMemberView(APIView):
    """
    PATCH /api/workspaces/members/<user_id>/
    Update a member's role or team assignment. Admin/Owner only.
    Body: { "role": "...", "team_id": <int>|null }
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        if membership.role not in ("owner", "admin"):
            return Response({"error": "Admin access required"}, status=403)

        if user_id == request.user.id:
            return Response(
                {"error": "Use settings to update your own profile"}, status=400
            )

        target = (
            WorkspaceMembership.objects.filter(
                user_id=user_id, workspace=membership.workspace, is_active=True
            )
            .select_related("user")
            .first()
        )

        if not target:
            return Response({"error": "Member not found in workspace"}, status=404)

        role = request.data.get("role")
        team_id = request.data.get("team_id", "NOT_SET")

        if role and role not in ("employee", "manager", "admin", "guest"):
            return Response(
                {"error": "role must be employee, manager, admin, or guest"}, status=400
            )

        if role:
            target.role = role
            target.save()

        if team_id != "NOT_SET":
            if team_id is not None:
                try:
                    from chat.models import Channel, ChannelMember

                    # STEP 1: Soft-leave old official team chats BEFORE touching team memberships
                    old_team_memberships = TeamMembership.objects.filter(
                        user=target.user, is_active=True
                    ).exclude(team_id=team_id)

                    for old_tm in old_team_memberships:
                        old_channel = Channel.objects.filter(
                            team_id=old_tm.team_id, channel_type="team"
                    ).first()
                        if old_channel:
                            ChannelMember.objects.filter(
                                channel=old_channel, user=target.user, is_active=True
                            ).update(is_active=False, left_at=timezone.now())

                    # STEP 2: Soft-delete old team memberships (preserve history)
                    TeamMembership.objects.filter(
                        user=target.user, is_active=True
                    ).update(is_active=False, left_at=timezone.now())

                    # STEP 3: Join new team
                    team = Team.objects.get(id=team_id, workspace=membership.workspace)
                    TeamMembership.objects.update_or_create(
                        team=team,
                        user=target.user,
                        defaults={"is_active": True, "left_at": None},
                    )

                    # STEP 4: Join new official team chat
                    new_channel = Channel.objects.filter(
                        team=team, channel_type="team"
                    ).first()
                    if new_channel:
                        ChannelMember.objects.update_or_create(
                            channel=new_channel,
                            user=target.user,
                            defaults={
                                "is_active": True,
                                "left_at": None,
                                "role": "member",
                            },
                        )

                    # If manager, set as team leader
                    if role == "manager" or target.role == "manager":
                        team.leader = target.user
                        team.save()
                except Team.DoesNotExist:
                    return Response({"error": "Team not found"}, status=404)
            else:
                # team_id is null — soft-delete all team memberships, no new team
                TeamMembership.objects.filter(user=target.user, is_active=True).update(
                    is_active=False, left_at=timezone.now()
                )

        team_name = (
            TeamMembership.objects.filter(user=target.user, is_active=True)
            .values_list("team__name", flat=True)
            .first()
        )

        return Response(
            {
                "detail": "Member updated",
                "user_id": user_id,
                "role": target.role,
                "team": team_name,
            }
        )


class GenerateInviteLinkView(APIView):
    """
    POST /api/workspaces/invite/generate/
    Body: { "role": "employee", "expires_hours": 72, "max_uses": 0 }
    Requires: invite_members permission
    """

    permission_classes = [IsAuthenticated]

    @require_permission("invite_members")
    def post(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found."}, status=404)

        workspace = membership.workspace
        role = request.data.get("role", "employee")
        expires_hours = int(request.data.get("expires_hours", 96))  # Default: 4 days
        max_uses = int(request.data.get("max_uses", 0))

        if expires_hours < 24:
            return Response(
                {"error": "Invite must be valid for at least 1 day (24 hours)."},
                status=400,
            )
        if expires_hours > 720:
            return Response(
                {"error": "Invite cannot be valid for more than 30 days (720 hours)."},
                status=400,
            )

        if role in ("owner", "admin") and membership.role not in ("owner", "admin"):
            return Response(
                {"error": "You cannot invite someone to a role higher than yours."},
                status=403,
            )

        expires_at = (
            timezone.now() + timedelta(hours=expires_hours) if expires_hours else None
        )

        invite = WorkspaceInvite.objects.create(
            workspace=workspace,
            created_by=request.user,
            role_to_assign=role,
            max_uses=max_uses,
            expires_at=expires_at,
        )

        invite_url = f"{request.scheme}://{request.get_host()}/join/{invite.token}"

        return Response(
            {
                "token": str(invite.token),
                "invite_url": invite_url,
                "role": role,
                "expires_at": invite.expires_at,
                "max_uses": max_uses,
            }
        )


class JoinWorkspaceView(APIView):
    """
    POST /api/workspaces/join/<token>/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        try:
            invite = WorkspaceInvite.objects.get(token=token)
        except WorkspaceInvite.DoesNotExist:
            return Response({"error": "Invalid invite link."}, status=404)

        if not invite.is_valid():
            return Response(
                {"error": "This invite link has expired or been disabled."}, status=400
            )

        existing = WorkspaceMembership.objects.filter(
            workspace=invite.workspace, user=request.user
        ).first()
        if existing:
            if existing.is_active:
                return Response(
                    {"message": "You are already a member of this workspace."}
                )
            else:
                existing.is_active = True
                existing.save()
                return Response({"message": "Welcome back to the workspace!"})

        WorkspaceMembership.objects.create(
            workspace=invite.workspace,
            user=request.user,
            role=invite.role_to_assign,
            invited_by=invite.created_by,
        )

        invite.use_count += 1
        invite.save()

        # NEW: Add user to the workspace's Unassigned Team (instead of general chat)
        try:
            if invite.workspace.unassigned_team:
                TeamMembership.objects.update_or_create(
                    team=invite.workspace.unassigned_team,
                    user=request.user,
                    defaults={"is_active": True, "is_leader": False, "left_at": None},
                )
        except Exception:
            pass

        return Response(
            {
                "message": f"Successfully joined {invite.workspace.name}!",
                "workspace": invite.workspace.name,
                "role": invite.role_to_assign,
            }
        )


class InviteInfoView(APIView):
    """
    GET /api/workspaces/join/<token>/info/
    """

    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            invite = WorkspaceInvite.objects.get(token=token)
        except WorkspaceInvite.DoesNotExist:
            return Response({"error": "Invalid invite link."}, status=404)

        if not invite.is_valid():
            return Response({"error": "This invite link has expired."}, status=400)

        return Response(
            {
                "workspace_name": invite.workspace.name,
                "role": invite.role_to_assign,
                "invited_by": invite.created_by.username,
                "expires_at": invite.expires_at,
            }
        )


class UpdateMemberRoleView(APIView):
    """
    PATCH /api/workspaces/members/<user_id>/role/
    Requires: manage_roles permission
    """

    permission_classes = [IsAuthenticated]

    @require_permission("manage_roles")
    def patch(self, request, user_id):
        new_role = request.data.get("role")
        valid_roles = ("owner", "admin", "manager", "employee", "guest")

        if new_role not in valid_roles:
            return Response(
                {"error": f"Invalid role. Choose from: {valid_roles}"}, status=400
            )

        my_membership = request.user.memberships.filter(is_active=True).first()
        workspace = my_membership.workspace

        role_rank = {"owner": 5, "admin": 4, "manager": 3, "employee": 2, "guest": 1}
        if role_rank.get(new_role, 0) >= role_rank.get(my_membership.role, 0):
            if my_membership.role != "owner":
                return Response(
                    {
                        "error": "You cannot assign a role equal to or higher than yours."
                    },
                    status=403,
                )

        try:
            target = WorkspaceMembership.objects.get(
                workspace=workspace, user_id=user_id
            )
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found."}, status=404)

        if target.role == "owner" and my_membership.role != "owner":
            return Response(
                {"error": "Cannot change the workspace owner's role."}, status=403
            )

        target.role = new_role
        target.save()

        return Response(
            {
                "message": f"Role updated to {new_role}.",
                "user": target.user.username,
                "role": new_role,
            }
        )


class RemoveMemberView(APIView):
    """
    DELETE /api/workspaces/members/<user_id>/
    Requires: remove_members permission
    """

    permission_classes = [IsAuthenticated]

    @require_permission("remove_members")
    def delete(self, request, user_id):
        my_membership = request.user.memberships.filter(is_active=True).first()
        workspace = my_membership.workspace

        try:
            target = WorkspaceMembership.objects.get(
                workspace=workspace, user_id=user_id
            )
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found."}, status=404)

        if target.role == "owner":
            return Response({"error": "Cannot remove the workspace owner."}, status=403)

        if target.user == request.user:
            return Response({"error": "Cannot remove yourself."}, status=400)

        target.is_active = False
        target.save()

        # Soft-leave all teams, channels, and DMs
        try:
            from chat.models import ChannelMember

            TeamMembership.objects.filter(user=target.user, is_active=True).update(
                is_active=False, left_at=timezone.now()
            )

            # All channel memberships including DMs — lose access entirely
            ChannelMember.objects.filter(user=target.user, is_active=True).update(
                is_active=False, left_at=timezone.now()
            )
        except Exception as e:
            logger.warning(f"Failed to soft-leave teams/channels on removal: {e}")

        # Clear pending notifications for this user in this workspace
        try:
            from notifications.models import Notification

            Notification.objects.filter(
                recipient=target.user, workspace=my_membership.workspace, status="unread"
            ).update(status="archived")
        except Exception as e:
            logger.warning(f"Failed to clear notifications on removal: {e}")

        # Delete pending DM requests involving this user in this workspace
        try:
            from chat.models import DMRequest

            DMRequest.objects.filter(
                workspace=my_membership.workspace,
                status="pending",
            ).filter(
                models.Q(sender=target.user) | models.Q(receiver=target.user)
            ).update(status="expired")
        except Exception as e:
            logger.warning(f"Failed to expire DM requests on removal: {e}")

        return Response(
            {"message": f"{target.user.username} has been removed from the workspace."}
        )


class MyPermissionsView(APIView):
    """
    GET /api/workspaces/my-permissions/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"role": None, "permissions": []})

        return Response(
            {
                "role": membership.role,
                "workspace": membership.workspace.name,
                "workspace_id": membership.workspace.id,
                "permissions": list(ROLE_PERMISSIONS.get(membership.role, set())),
            }
        )


class InviteCenterCountsView(APIView):
    """
    GET /api/workspaces/invites/counts/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=404)

        workspace = membership.workspace

        from chat.models import DMRequest

        now = timezone.now()
        DMRequest.objects.filter(
            receiver=request.user,
            workspace=workspace,
            status="pending",
            expires_at__lte=now,
        ).update(status="expired")

        workspace_count = 0
        if membership.role in ("owner", "admin"):
            workspace_count = WorkspaceInvite.objects.filter(
                workspace=workspace, status="active"
            ).count()

        dm_requests_count = DMRequest.objects.filter(
            receiver=request.user, workspace=workspace, status="pending"
        ).count()

        teams_count = TeamInvite.objects.filter(
            invitee=request.user, workspace=workspace, status="pending"
        ).count()

        private_groups_count = PrivateGroupInvite.objects.filter(
            invitee=request.user, workspace=workspace, status="pending"
        ).count()

        return Response(
            {
                "workspace": workspace_count,
                "teams": teams_count,
                "private_groups": private_groups_count,
                "dm_requests": dm_requests_count,
            }
        )


class InviteCenterTabView(APIView):
    """
    GET /api/workspaces/invites/?tab=workspace|teams|private_groups|dm_requests
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=404)

        workspace = membership.workspace
        tab = request.query_params.get("tab", "")

        if tab == "workspace":
            if membership.role not in ("owner", "admin"):
                return Response({"items": []})
            invites = (
                WorkspaceInvite.objects.filter(workspace=workspace, status="active")
                .select_related("created_by")
                .order_by("-created_at")
            )
            return Response(
                {
                    "items": [
                        {
                            "id": inv.id,
                            "token": str(inv.token),
                            "role_to_assign": inv.role_to_assign,
                            "max_uses": inv.max_uses,
                            "use_count": inv.use_count,
                            "expires_at": (
                                inv.expires_at.isoformat() if inv.expires_at else None
                            ),
                            "created_by": inv.created_by.username,
                            "created_at": inv.created_at.isoformat(),
                            "is_valid": inv.is_valid(),
                        }
                        for inv in invites
                    ]
                }
            )

        elif tab == "teams":
            # Auto-expire stale invites
            TeamInvite.objects.filter(
                invitee=request.user,
                workspace=workspace,
                status="pending",
                expires_at__lte=timezone.now(),
            ).update(status="expired")

            invites = (
                TeamInvite.objects.filter(
                    invitee=request.user, workspace=workspace, status="pending"
                )
                .select_related("team", "inviter")
                .order_by("-created_at")
            )

            return Response(
                {
                    "items": [
                        {
                            "id": inv.id,
                            "team_id": inv.team.id,
                            "team_name": inv.team.name,
                            "inviter_id": inv.inviter.id,
                            "inviter_name": inv.inviter.get_full_name()
                            or inv.inviter.username,
                            "expires_at": (
                                inv.expires_at.isoformat() if inv.expires_at else None
                            ),
                            "created_at": inv.created_at.isoformat(),
                        }
                        for inv in invites
                    ]
                }
            )

        elif tab == "private_groups":
            # Auto-expire stale invites
            PrivateGroupInvite.objects.filter(
                invitee=request.user,
                workspace=workspace,
                status="pending",
                expires_at__lte=timezone.now(),
            ).update(status="expired")

            invites = (
                PrivateGroupInvite.objects.filter(
                    invitee=request.user, workspace=workspace, status="pending"
                )
                .select_related("channel", "inviter")
                .order_by("-created_at")
            )

            return Response(
                {
                    "items": [
                        {
                            "id": inv.id,
                            "channel_id": inv.channel.id,
                            "channel_name": inv.channel.name,
                            "inviter_id": inv.inviter.id,
                            "inviter_name": inv.inviter.get_full_name()
                            or inv.inviter.username,
                            "expires_at": (
                                inv.expires_at.isoformat() if inv.expires_at else None
                            ),
                            "created_at": inv.created_at.isoformat(),
                        }
                        for inv in invites
                    ]
                }
            )

        elif tab == "dm_requests":
            from chat.models import DMRequest

            now = timezone.now()
            DMRequest.objects.filter(
                receiver=request.user,
                workspace=workspace,
                status="pending",
                expires_at__lte=now,
            ).update(status="expired")
            requests = (
                DMRequest.objects.filter(
                    receiver=request.user, workspace=workspace, status="pending"
                )
                .select_related("sender")
                .order_by("-created_at")
            )
            return Response(
                {
                    "items": [
                        {
                            "id": req.id,
                            "sender_id": req.sender.id,
                            "sender_name": req.sender.get_full_name()
                            or req.sender.username,
                            "initial_message": req.initial_message,
                            "expires_at": (
                                req.expires_at.isoformat() if req.expires_at else None
                            ),
                            "created_at": req.created_at.isoformat(),
                        }
                        for req in requests
                    ]
                }
            )

        else:
            return Response({"error": "Invalid tab"}, status=400)


class TeamInviteView(APIView):
    """
    POST /api/workspaces/teams/invite/
    Invite a user to a team.
    Permissions: team leader, manager, admin, or owner.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        team_id = request.data.get("team_id")
        invitee_id = request.data.get("user_id")

        if not team_id or not invitee_id:
            return Response({"error": "team_id and user_id required"}, status=400)

        team = Team.objects.filter(id=team_id, workspace=membership.workspace).first()
        if not team:
            return Response({"error": "Team not found"}, status=404)

        # Permission check: team leader, manager, admin, or owner
        can_invite = False
        if membership.role in ("owner", "admin", "manager"):
            can_invite = True
        elif team.leader == request.user:
            can_invite = True

        if not can_invite:
            return Response(
                {"error": "You do not have permission to invite to this team"},
                status=403,
            )

        # Check invitee is in workspace
        invitee_membership = WorkspaceMembership.objects.filter(
            user_id=invitee_id, workspace=membership.workspace, is_active=True
        ).first()
        if not invitee_membership:
            return Response({"error": "User not found in workspace"}, status=404)

        invitee = invitee_membership.user

        # Check not already a team member
        if TeamMembership.objects.filter(
            team=team, user=invitee, is_active=True
        ).exists():
            return Response({"error": "User is already in this team"}, status=400)

        # Check no pending invite
        if TeamInvite.objects.filter(
            team=team, invitee=invitee, workspace=membership.workspace, status="pending"
        ).exists():
            return Response({"error": "Invite already pending"}, status=409)

        expires_at = timezone.now() + timedelta(days=4)

        invite = TeamInvite.objects.create(
            team=team,
            inviter=request.user,
            invitee=invitee,
            workspace=membership.workspace,
            status="pending",
            expires_at=expires_at,
        )

        # Emit notification
        try:
            NotificationService.create_and_emit(
                WorkspaceEvent(
                    actor_id=request.user.id,
                    workspace_id=membership.workspace.id,
                    event_description=f"You've been invited to join team {team.name}",
                    member_ids=[invitee.id],
                )
            )
        except Exception as e:
            logger.warning(f"Failed to emit team invite notification: {e}")

        return Response(
            {
                "id": invite.id,
                "team_id": team.id,
                "team_name": team.name,
                "invitee_id": invitee.id,
                "status": invite.status,
                "expires_at": invite.expires_at.isoformat(),
            },
            status=201,
        )


class TeamInviteRespondView(APIView):
    """
    PATCH /api/workspaces/teams/invite/<pk>/
    Accept or reject a team invite.
    Accepting grants: team chat, tasks, files, announcements.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        # Auto-expire stale invites
        TeamInvite.objects.filter(
            invitee=request.user,
            workspace=membership.workspace,
            status="pending",
            expires_at__lte=timezone.now(),
        ).update(status="expired")

        try:
            invite = TeamInvite.objects.get(
                id=pk, invitee=request.user, workspace=membership.workspace
            )
        except TeamInvite.DoesNotExist:
            return Response({"error": "Invite not found"}, status=404)

        if invite.status != "pending":
            return Response({"error": f"Invite is already {invite.status}"}, status=400)

        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return Response(
                {"error": "status must be 'accepted' or 'rejected'"}, status=400
            )

        if new_status == "accepted":
            # Add to team
            TeamMembership.objects.update_or_create(
                team=invite.team,
                user=request.user,
                defaults={"is_active": True, "left_at": None, "is_leader": False},
            )

            # Add to team chat channel
            try:
                from chat.models import Channel, ChannelMember

                team_channel = Channel.objects.filter(
                    team=invite.team, channel_type="team"
                ).first()

                if team_channel:
                    ChannelMember.objects.update_or_create(
                        channel=team_channel,
                        user=request.user,
                        defaults={"role": "member", "is_active": True, "left_at": None},
                    )
            except Exception as e:
                logger.warning(f"Failed to add user to team chat on invite accept: {e}")

        invite.status = new_status
        invite.save()

        return Response(
            {
                "id": invite.id,
                "team_id": invite.team.id,
                "team_name": invite.team.name,
                "status": invite.status,
            }
        )


class LeaveTeamView(APIView):
    """
    POST /api/workspaces/teams/<team_id>/leave/
    Leave a team. Immediately lose tasks, announcements, uploads, new messages.
    Keep read-only access to old messages and previously visible files.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, team_id):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        team = Team.objects.filter(id=team_id, workspace=membership.workspace).first()
        if not team:
            return Response({"error": "Team not found"}, status=404)

        team_membership = TeamMembership.objects.filter(
            team=team, user=request.user, is_active=True
        ).first()

        if not team_membership:
            return Response({"error": "You are not in this team"}, status=400)

        # Team leaders must transfer leadership first
        if team.leader == request.user:
            return Response(
                {"error": "Transfer leadership before leaving the team"},
                status=400,
            )

        # Soft-delete team membership
        team_membership.is_active = False
        team_membership.left_at = timezone.now()
        team_membership.save()

        # Soft-remove from ALL team channels (official + team chats)
        # Keeps read-only history — user can still view old messages via REST
        try:
            from chat.models import ChannelMember, Channel

            team_channel_ids = Channel.objects.filter(
                team=team,
            ).values_list("id", flat=True)

            ChannelMember.objects.filter(
                channel_id__in=team_channel_ids,
                user=request.user,
                is_active=True,
            ).update(is_active=False, left_at=timezone.now())
        except Exception as e:
            logger.warning(f"Failed to remove user from team channels on leave: {e}")

        # Phase 7: Remove sending rights from all remaining workspace channels
        # (User keeps read-only history access)
        # Note: tasks, announcements, uploads are implicitly restricted because
        # the user is no longer an active channel member.

        return Response(
            {
                "detail": f"Left team {team.name}. You retain read-only access to history."
            }
        )


class PrivateGroupInviteView(APIView):
    """
    POST /api/workspaces/groups/invite/
    Invite users to a private group.
    Only creator or group admin can invite.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        channel_id = request.data.get("channel_id")
        invitee_ids = request.data.get("user_ids", [])

        if not channel_id or not invitee_ids:
            return Response({"error": "channel_id and user_ids required"}, status=400)

        try:
            from chat.models import Channel, ChannelMember

            channel = Channel.objects.get(
                id=channel_id,
                workspace=membership.workspace,
                channel_type="private_group",
            )
        except Exception:
            return Response({"error": "Private group not found"}, status=404)

        # Permission: creator or admin of the group
        is_owner = channel.owner == request.user
        is_admin = ChannelMember.objects.filter(
            channel=channel, user=request.user, role="admin", is_active=True
        ).exists()

        if not (is_owner or is_admin):
            return Response(
                {"error": "Only the group creator or admin can invite"}, status=403
            )

        created_invites = []
        from datetime import timedelta

        expires_at = timezone.now() + timedelta(hours=24)

        for uid in invitee_ids:
            # Skip if not in workspace
            if not WorkspaceMembership.objects.filter(
                user_id=uid, workspace=membership.workspace, is_active=True
            ).exists():
                continue

            # Skip if already a member
            if ChannelMember.objects.filter(
                channel=channel, user_id=uid, is_active=True
            ).exists():
                continue

            # Skip if already invited
            if PrivateGroupInvite.objects.filter(
                channel=channel,
                invitee_id=uid,
                workspace=membership.workspace,
                status="pending",
            ).exists():
                continue

            invite = PrivateGroupInvite.objects.create(
                channel=channel,
                inviter=request.user,
                invitee_id=uid,
                workspace=membership.workspace,
                status="pending",
                expires_at=expires_at,
            )
            created_invites.append(invite.id)

            # Emit notification
            try:
                NotificationService.create_and_emit(
                    WorkspaceEvent(
                        actor_id=request.user.id,
                        workspace_id=membership.workspace.id,
                        event_description=f"You've been invited to group {channel.name}",
                        member_ids=[uid],
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to emit group invite notification: {e}")

        return Response(
            {
                "created_count": len(created_invites),
                "invite_ids": created_invites,
            },
            status=201,
        )


class PrivateGroupInviteRespondView(APIView):
    """
    PATCH /api/workspaces/groups/invite/<pk>/
    Accept or reject a private group invite.
    Accepting instantly joins the group. No second approval.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        # Auto-expire stale invites
        PrivateGroupInvite.objects.filter(
            invitee=request.user,
            workspace=membership.workspace,
            status="pending",
            expires_at__lte=timezone.now(),
        ).update(status="expired")

        try:
            invite = PrivateGroupInvite.objects.get(
                id=pk, invitee=request.user, workspace=membership.workspace
            )
        except PrivateGroupInvite.DoesNotExist:
            return Response({"error": "Invite not found"}, status=404)

        if invite.status != "pending":
            return Response({"error": f"Invite is already {invite.status}"}, status=400)

        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return Response(
                {"error": "status must be 'accepted' or 'rejected'"}, status=400
            )

        if new_status == "accepted":
            try:
                from chat.models import Channel, ChannelMember

                channel = invite.channel

                # Instantly join
                ChannelMember.objects.update_or_create(
                    channel=channel,
                    user=request.user,
                    defaults={"role": "member", "is_active": True, "left_at": None},
                )

                # Check if group should become active (creator + 1 = 2 members)
                if channel.is_pending:
                    active_count = ChannelMember.objects.filter(
                        channel=channel, is_active=True
                    ).count()

                    if active_count >= 2:
                        channel.is_pending = False
                        channel.save()

            except Exception as e:
                logger.warning(f"Failed to join private group on invite accept: {e}")

        invite.status = new_status
        invite.save()

        return Response(
            {
                "id": invite.id,
                "channel_id": invite.channel.id,
                "channel_name": invite.channel.name,
                "status": invite.status,
            }
        )


class CleanupPendingGroupsView(APIView):
    """
    POST /api/workspaces/groups/cleanup/
    Deletes pending private groups older than 24h with fewer than 2 members.
    Notifies the creator.
    Can be called by any authenticated user (lazy cleanup).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        from chat.models import Channel, ChannelMember

        cutoff = timezone.now() - timedelta(hours=24)
        pending_groups = Channel.objects.filter(
            workspace=membership.workspace,
            channel_type="private_group",
            is_pending=True,
            created_at__lte=cutoff,
        )

        deleted = []
        for group in pending_groups:
            active_count = ChannelMember.objects.filter(
                channel=group, is_active=True
            ).count()

            if active_count < 2:
                # Notify owner
                try:
                    NotificationService.create_and_emit(
                        WorkspaceEvent(
                            actor_id=request.user.id,
                            workspace_id=membership.workspace.id,
                            event_description=f"Group '{group.name}' was deleted: not enough members joined within 24 hours.",
                            member_ids=[group.owner_id] if group.owner_id else [],
                        )
                    )
                except Exception as e:
                    logger.warning(f"Failed to emit group cleanup notification: {e}")

                group.delete()
                deleted.append(group.name)

        return Response({"deleted_groups": deleted, "count": len(deleted)})

class LeaveWorkspaceView(APIView):
    """
    POST /api/workspaces/leave/
    Leave a workspace. Owners cannot leave — must transfer ownership or delete.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        membership = request.user.memberships.filter(is_active=True).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=400)

        # Owner cannot leave — must transfer or delete
        if membership.role == "owner":
            return Response(
                {"error": "Workspace owners cannot leave. Transfer ownership or delete the workspace."},
                status=403,
            )

        # Soft-leave everything
        membership.is_active = False
        membership.left_at = timezone.now()
        membership.save()

        # Soft-leave all teams
        TeamMembership.objects.filter(user=request.user, is_active=True).update(
            is_active=False, left_at=timezone.now()
        )

        # Soft-leave all channels including DMs (lose access entirely)
        try:
            from chat.models import ChannelMember

            ChannelMember.objects.filter(user=request.user, is_active=True).update(
                is_active=False, left_at=timezone.now()
            )
        except Exception as e:
            logger.warning(f"Failed to soft-leave channels on workspace leave: {e}")

        # Archive unread notifications
        try:
            from notifications.models import Notification

            Notification.objects.filter(
                recipient=request.user,
                workspace=membership.workspace,
                status="unread",
            ).update(status="archived")
        except Exception as e:
            logger.warning(f"Failed to archive notifications on workspace leave: {e}")

        # Expire pending DM requests
        try:
            from chat.models import DMRequest

            DMRequest.objects.filter(
                workspace=membership.workspace,
                status="pending",
            ).filter(
                models.Q(sender=request.user) | models.Q(receiver=request.user)
            ).update(status="expired")
        except Exception as e:
            logger.warning(f"Failed to expire DM requests on workspace leave: {e}")

        return Response({"message": f"You have left {membership.workspace.name}."})