# acumen_backend/workspaces/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

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
    TeamType,
)
from .permissions import IsWorkspaceMember, HasWorkspacePermission, is_team_leader
from .services import WorkspaceService, TeamService
from notifications.services import NotificationService, WorkspaceEvent
import logging

logger = logging.getLogger(__name__)


class WorkspaceBaseView(APIView):
    """Base view to enforce explicit workspace context resolution from URL."""

    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_workspace(self):
        workspace_id = self.kwargs.get("workspace_id")
        if not workspace_id:
            return None
        return get_object_or_404(Workspace, id=workspace_id)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_workspace(request, workspace_id):
    workspace = get_object_or_404(Workspace, id=workspace_id)
    return Response(
        {
            "id": workspace.id,
            "name": workspace.name,
            "slug": workspace.slug,
            "owner": workspace.owner.username,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_team(request, workspace_id):
    team_membership = (
        TeamMembership.objects.filter(
            user=request.user, team__workspace_id=workspace_id, is_active=True
        )
        .select_related("team")
        .first()
    )
    if not team_membership:
        return Response({"team": None})

    team = team_membership.team
    members = TeamMembership.objects.filter(team=team, is_active=True).select_related(
        "user"
    )
    return Response(
        {
            "id": team.id,
            "name": team.name,
            "leaders": list(
                TeamMembership.objects.filter(
                    team=team, is_active=True, is_leader=True
                ).values_list("user__username", flat=True)
            ),
            "members": [
                {
                    "user_id": m.user.id,
                    "username": m.user.username,
                    "full_name": f"{m.user.first_name} {m.user.last_name}".strip()
                    or m.user.username,
                    "role": WorkspaceMembership.objects.filter(
                        user=m.user, workspace_id=workspace_id, is_active=True
                    )
                    .values_list("role", flat=True)
                    .first()
                    or "member",
                    "is_leader": m.is_leader,
                }
                for m in members
            ],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_teams(request, workspace_id):
    membership = WorkspaceMembership.objects.filter(
        user=request.user, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership:
        return Response({"error": "Not authorized"}, status=403)

    # FIX: Only return STANDARD teams to the admin UI.
    # System teams (General, Management, Unassigned) are infrastructure and should be hidden.
    teams = Team.objects.filter(workspace_id=workspace_id, team_type=TeamType.STANDARD)
    response_data = []
    for t in teams:
        leaders = list(
            TeamMembership.objects.filter(
                team=t, is_active=True, is_leader=True
            ).values_list("user__username", flat=True)
        )

        response_data.append(
            {
                "id": t.id,
                "name": t.name,
                "team_type": t.team_type,
                "member_count": TeamMembership.objects.filter(
                    team=t, is_active=True
                ).count(),
                "leaders": leaders,
                "created_at": t.created_at.isoformat(),
            }
        )
    return Response(response_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def workspace_members(request, workspace_id):
    membership = WorkspaceMembership.objects.filter(
        user=request.user, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership:
        return Response({"error": "Not authorized"}, status=403)

    members = WorkspaceMembership.objects.filter(
        workspace_id=workspace_id, is_active=True
    ).select_related("user")

    response_data = []
    for m in members:
        # Map legacy roles to new Phase 1 RBAC matrix
        role = m.role
        if role == "employee":
            role = "member"
        elif role == "manager":
            role = "admin"

        # Fetch ONLY standard team membership for the UI
        team_name = (
            TeamMembership.objects.filter(
                user=m.user,
                team__workspace_id=workspace_id,
                is_active=True,
                team__team_type=TeamType.STANDARD,
            )
            .values_list("team__name", flat=True)
            .first()
        )

        response_data.append(
            {
                "user_id": m.user.id,
                "username": m.user.username,
                "full_name": f"{m.user.first_name} {m.user.last_name}".strip()
                or m.user.username,
                "role": role,
                "team": team_name or "Unassigned",
                "joined_at": m.joined_at.isoformat(),
            }
        )

    return Response(response_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request, workspace_id):
    membership = WorkspaceMembership.objects.filter(
        user=request.user, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership:
        return Response({"total_members": 0, "total_teams": 0, "role": "member"})

    return Response(
        {
            "total_members": WorkspaceMembership.objects.filter(
                workspace_id=workspace_id, is_active=True
            ).count(),
            "total_teams": Team.objects.filter(workspace_id=workspace_id).count(),
            "role": membership.role,
        }
    )


class CreateTeamView(WorkspaceBaseView):
    required_permission = "create_teams"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Team name required"}, status=400)
        if Team.objects.filter(name=name, workspace=workspace).exists():
            return Response(
                {"error": "A team with this name already exists"}, status=400
            )

        leader_id = request.data.get("leader_id")
        leader = None
        if leader_id:
            leader_membership = WorkspaceMembership.objects.filter(
                user_id=leader_id, workspace=workspace, is_active=True
            ).first()
            if not leader_membership:
                return Response({"error": "Leader not found in workspace"}, status=404)
            leader = leader_membership.user

        team = TeamService.create_team(
            workspace=workspace, name=name, creator=request.user
        )
        if leader:
            TeamService.add_member(team, leader)
            TeamService.promote_leader(team, leader)

        return Response(
            {
                "id": team.id,
                "name": team.name,
                "leader": leader.username if leader else None,
            },
            status=201,
        )


class TeamDetailView(WorkspaceBaseView):
    """Handles updating (Rename/Description) and deleting a Team."""

    def patch(self, request, workspace_id, team_id):
        workspace = self.get_workspace()
        try:
            team = Team.objects.get(
                id=team_id, workspace=workspace, team_type=TeamType.STANDARD
            )
        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found or cannot be modified."}, status=404
            )

        name = request.data.get("name")
        description = request.data.get("description")

        if name:
            team.name = name
        if description is not None:
            team.description = description

        team.save()
        return Response(
            {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "detail": "Team updated successfully",
            }
        )

    def delete(self, request, workspace_id, team_id):
        workspace = self.get_workspace()
        try:
            team = Team.objects.get(
                id=team_id, workspace=workspace, team_type=TeamType.STANDARD
            )
        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found or cannot be deleted."}, status=404
            )

        # TeamService.delete_team handles deleting the associated chat channel
        TeamService.delete_team(team)
        return Response({"detail": "Team deleted successfully"})


class InviteMemberView(WorkspaceBaseView):
    required_permission = "invite_members"

    def post(self, request, workspace_id):
        from django.contrib.auth.models import User

        workspace = self.get_workspace()

        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        role = request.data.get("role", "member")
        team_id = request.data.get("team_id")

        if role not in ("member", "admin", "guest"):
            return Response(
                {"error": "role must be member, admin, or guest"}, status=400
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

        if WorkspaceMembership.objects.filter(
            user=target_user, workspace=workspace, is_active=True
        ).exists():
            return Response({"error": "User is already in this workspace"}, status=400)

        WorkspaceService.join_workspace(
            workspace, target_user, role=role, invited_by=request.user
        )

        if team_id:
            try:
                team = Team.objects.get(id=team_id, workspace=workspace)
                TeamService.add_member(team, target_user)
            except Team.DoesNotExist:
                pass

        try:
            member_ids = list(
                WorkspaceMembership.objects.filter(
                    workspace=workspace, is_active=True
                ).values_list("user_id", flat=True)
            )
            NotificationService.create_and_emit(
                WorkspaceEvent(
                    actor_id=request.user.id,
                    workspace_id=workspace.id,
                    event_description=f"{target_user.username} joined the workspace",
                    member_ids=member_ids,
                )
            )
        except Exception as e:
            logger.warning(f"Failed to emit WorkspaceEvent: {e}")

        return Response(
            {
                "detail": "Member added successfully",
                "user_id": target_user.id,
                "username": target_user.username,
                "role": role,
            },
            status=201,
        )


class MemberDetailView(WorkspaceBaseView):
    """
    Unified view for handling PATCH (Move Team) and DELETE (Remove Member) on a specific user.
    """

    def patch(self, request, workspace_id, user_id):
        # Permission check: Must be admin/owner to manage roles
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace_id=workspace_id, is_active=True
        ).first()
        if not membership or membership.role not in ("owner", "admin"):
            return Response({"error": "Not authorized"}, status=403)

        workspace = self.get_workspace()
        if user_id == request.user.id and "role" in request.data:
            return Response(
                {"error": "Use settings to update your own profile"}, status=400
            )

        target = (
            WorkspaceMembership.objects.filter(
                user_id=user_id, workspace=workspace, is_active=True
            )
            .select_related("user")
            .first()
        )
        if not target:
            return Response({"error": "Member not found in workspace"}, status=404)

        role = request.data.get("role")
        team_id = request.data.get("team_id", "NOT_SET")

        if role and role not in ("member", "admin", "guest"):
            return Response(
                {"error": "role must be member, admin, or guest"}, status=400
            )
        if role:
            target.role = role
            target.save()

        if team_id != "NOT_SET":
            # Remove from all current standard teams
            current_teams = TeamMembership.objects.filter(
                user=target.user,
                team__workspace=workspace,
                is_active=True,
                team__team_type=TeamType.STANDARD,
            )
            for tm in current_teams:
                TeamService.remove_member(tm.team, target.user)

            # Add to new team if provided
            if team_id is not None:
                try:
                    team = Team.objects.get(id=team_id, workspace=workspace)
                    TeamService.add_member(team, target.user)
                except Team.DoesNotExist:
                    return Response({"error": "Team not found"}, status=404)

        # Get updated team name for response
        new_team_name = (
            TeamMembership.objects.filter(
                user=target.user,
                team__workspace=workspace,
                is_active=True,
                team__team_type=TeamType.STANDARD,
            )
            .values_list("team__name", flat=True)
            .first()
        )

        return Response(
            {
                "detail": "Member updated",
                "user_id": user_id,
                "role": target.role,
                "team": new_team_name or "Unassigned",
            }
        )

    def delete(self, request, workspace_id, user_id):
        # Permission check: Must be admin/owner to remove members
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace_id=workspace_id, is_active=True
        ).first()
        if not membership or membership.role not in ("owner", "admin"):
            return Response({"error": "Not authorized"}, status=403)

        workspace = self.get_workspace()
        try:
            target = WorkspaceMembership.objects.get(
                workspace=workspace, user_id=user_id
            )
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found."}, status=404)

        if target.role == "owner" or target.user == request.user:
            return Response(
                {"error": "Cannot remove the workspace owner or yourself."}, status=403
            )

        WorkspaceService.leave_workspace(workspace, target.user)
        try:
            from notifications.models import Notification

            Notification.objects.filter(
                recipient=target.user, workspace=workspace, status="unread"
            ).update(status="archived")
        except Exception:
            pass

        return Response(
            {"message": f"{target.user.username} has been removed from the workspace."}
        )


class GenerateInviteLinkView(WorkspaceBaseView):
    required_permission = "invite_members"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        role = request.data.get("role", "member")
        expires_hours = int(request.data.get("expires_hours", 96))
        max_uses = int(request.data.get("max_uses", 0))

        if expires_hours < 24 or expires_hours > 720:
            return Response({"error": "Invalid expiry duration."}, status=400)

        membership = WorkspaceMembership.objects.get(
            user=request.user, workspace=workspace, is_active=True
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

        return Response(
            {
                "token": str(invite.token),
                "invite_url": f"{request.scheme}://{request.get_host()}/join/{invite.token}",
                "role": role,
                "expires_at": invite.expires_at,
                "max_uses": max_uses,
            }
        )


class JoinWorkspaceView(APIView):
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

        WorkspaceService.join_workspace(
            invite.workspace,
            request.user,
            role=invite.role_to_assign,
            invited_by=invite.created_by,
        )
        invite.use_count += 1
        invite.save()

        return Response(
            {
                "message": f"Successfully joined {invite.workspace.name}!",
                "workspace": invite.workspace.name,
                "role": invite.role_to_assign,
            }
        )


class InviteInfoView(APIView):
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


class UpdateMemberRoleView(WorkspaceBaseView):
    required_permission = "manage_roles"

    def patch(self, request, workspace_id, user_id):
        new_role = request.data.get("role")
        if new_role not in ("owner", "admin", "member", "guest"):
            return Response(
                {
                    "error": f"Invalid role. Choose from: {('owner', 'admin', 'member', 'guest')}"
                },
                status=400,
            )

        workspace = self.get_workspace()
        my_membership = WorkspaceMembership.objects.get(
            user=request.user, workspace=workspace, is_active=True
        )

        role_rank = {"owner": 5, "admin": 4, "member": 2, "guest": 1}
        if (
            role_rank.get(new_role, 0) >= role_rank.get(my_membership.role, 0)
            and my_membership.role != "owner"
        ):
            return Response(
                {"error": "You cannot assign a role equal to or higher than yours."},
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


class RemoveMemberView(WorkspaceBaseView):
    required_permission = "remove_members"

    def delete(self, request, workspace_id, user_id):
        workspace = self.get_workspace()
        try:
            target = WorkspaceMembership.objects.get(
                workspace=workspace, user_id=user_id
            )
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found."}, status=404)

        if target.role == "owner" or target.user == request.user:
            return Response(
                {"error": "Cannot remove the workspace owner or yourself."}, status=403
            )

        WorkspaceService.leave_workspace(workspace, target.user)
        try:
            from notifications.models import Notification

            Notification.objects.filter(
                recipient=target.user, workspace=workspace, status="unread"
            ).update(status="archived")
        except Exception:
            pass

        return Response(
            {"message": f"{target.user.username} has been removed from the workspace."}
        )


class MyPermissionsView(WorkspaceBaseView):
    def get(self, request, workspace_id):
        workspace = self.get_workspace()
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).first()
        if not membership:
            return Response({"role": None, "permissions": []})
        return Response(
            {
                "role": membership.role,
                "workspace": workspace.name,
                "workspace_id": workspace.id,
                "permissions": list(ROLE_PERMISSIONS.get(membership.role, set())),
            }
        )


class InviteCenterCountsView(WorkspaceBaseView):
    def get(self, request, workspace_id):
        workspace = self.get_workspace()
        from chat.models import DMRequest

        now = timezone.now()
        DMRequest.objects.filter(
            receiver=request.user,
            workspace=workspace,
            status="pending",
            expires_at__lte=now,
        ).update(status="expired")

        workspace_count = 0
        membership = WorkspaceMembership.objects.get(
            user=request.user, workspace=workspace, is_active=True
        )
        if membership.role in ("owner", "admin"):
            workspace_count = WorkspaceInvite.objects.filter(
                workspace=workspace, status="active"
            ).count()

        return Response(
            {
                "workspace": workspace_count,
                "teams": TeamInvite.objects.filter(
                    invitee=request.user, workspace=workspace, status="pending"
                ).count(),
                "private_groups": PrivateGroupInvite.objects.filter(
                    invitee=request.user, workspace=workspace, status="pending"
                ).count(),
                "dm_requests": DMRequest.objects.filter(
                    receiver=request.user, workspace=workspace, status="pending"
                ).count(),
            }
        )


class InviteCenterTabView(WorkspaceBaseView):
    def get(self, request, workspace_id):
        workspace = self.get_workspace()
        tab = request.query_params.get("tab", "")

        if tab == "workspace":
            membership = WorkspaceMembership.objects.get(
                user=request.user, workspace=workspace, is_active=True
            )
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


class TeamInviteView(WorkspaceBaseView):
    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        team_id = request.data.get("team_id")
        invitee_id = request.data.get("user_id")
        if not team_id or not invitee_id:
            return Response({"error": "team_id and user_id required"}, status=400)

        team = Team.objects.filter(id=team_id, workspace=workspace).first()
        if not team:
            return Response({"error": "Team not found"}, status=404)

        membership = WorkspaceMembership.objects.get(
            user=request.user, workspace=workspace, is_active=True
        )
        if membership.role not in ("owner", "admin") and not is_team_leader(
            request.user, team.id
        ):
            return Response(
                {"error": "You do not have permission to invite to this team"},
                status=403,
            )

        invitee_membership = WorkspaceMembership.objects.filter(
            user_id=invitee_id, workspace=workspace, is_active=True
        ).first()
        if not invitee_membership:
            return Response({"error": "User not found in workspace"}, status=404)
        invitee = invitee_membership.user

        if TeamMembership.objects.filter(
            team=team, user=invitee, is_active=True
        ).exists():
            return Response({"error": "User is already in this team"}, status=400)
        if TeamInvite.objects.filter(
            team=team, invitee=invitee, workspace=workspace, status="pending"
        ).exists():
            return Response({"error": "Invite already pending"}, status=409)

        expires_at = timezone.now() + timedelta(days=4)
        invite = TeamInvite.objects.create(
            team=team,
            inviter=request.user,
            invitee=invitee,
            workspace=workspace,
            status="pending",
            expires_at=expires_at,
        )

        try:
            NotificationService.create_and_emit(
                WorkspaceEvent(
                    actor_id=request.user.id,
                    workspace_id=workspace.id,
                    event_description=f"You've been invited to join team {team.name}",
                    member_ids=[invitee.id],
                )
            )
        except Exception:
            pass
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


class TeamInviteRespondView(WorkspaceBaseView):
    def patch(self, request, workspace_id, pk):
        workspace = self.get_workspace()
        TeamInvite.objects.filter(
            invitee=request.user,
            workspace=workspace,
            status="pending",
            expires_at__lte=timezone.now(),
        ).update(status="expired")

        try:
            invite = TeamInvite.objects.get(
                id=pk, invitee=request.user, workspace=workspace
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
            TeamService.add_member(invite.team, request.user)

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


class LeaveTeamView(WorkspaceBaseView):
    def post(self, request, workspace_id, team_id):
        workspace = self.get_workspace()
        try:
            team = Team.objects.get(id=team_id, workspace=workspace)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=404)

        if is_team_leader(request.user, team.id):
            return Response(
                {"error": "Transfer leadership before leaving the team"}, status=400
            )

        TeamService.remove_member(team, request.user)
        return Response(
            {
                "detail": f"Left team {team.name}. You retain read-only access to history."
            }
        )


class PrivateGroupInviteView(WorkspaceBaseView):
    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        channel_id = request.data.get("channel_id")
        invitee_ids = request.data.get("user_ids", [])
        if not channel_id or not invitee_ids:
            return Response({"error": "channel_id and user_ids required"}, status=400)

        try:
            from chat.models import Channel, ChannelMember

            channel = Channel.objects.get(
                id=channel_id, workspace=workspace, channel_type="private_group"
            )
        except Exception:
            return Response({"error": "Private group not found"}, status=404)

        is_owner = channel.owner == request.user
        is_admin = ChannelMember.objects.filter(
            channel=channel, user=request.user, role="admin", is_active=True
        ).exists()
        if not (is_owner or is_admin):
            return Response(
                {"error": "Only the group creator or admin can invite"}, status=403
            )

        created_invites = []
        expires_at = timezone.now() + timedelta(hours=24)
        for uid in invitee_ids:
            if not WorkspaceMembership.objects.filter(
                user_id=uid, workspace=workspace, is_active=True
            ).exists():
                continue
            if ChannelMember.objects.filter(
                channel=channel, user_id=uid, is_active=True
            ).exists():
                continue
            if PrivateGroupInvite.objects.filter(
                channel=channel, invitee_id=uid, workspace=workspace, status="pending"
            ).exists():
                continue

            invite = PrivateGroupInvite.objects.create(
                channel=channel,
                inviter=request.user,
                invitee_id=uid,
                workspace=workspace,
                status="pending",
                expires_at=expires_at,
            )
            created_invites.append(invite.id)
            try:
                NotificationService.create_and_emit(
                    WorkspaceEvent(
                        actor_id=request.user.id,
                        workspace_id=workspace.id,
                        event_description=f"You've been invited to group {channel.name}",
                        member_ids=[uid],
                    )
                )
            except Exception:
                pass

        return Response(
            {"created_count": len(created_invites), "invite_ids": created_invites},
            status=201,
        )


class PrivateGroupInviteRespondView(WorkspaceBaseView):
    def patch(self, request, workspace_id, pk):
        workspace = self.get_workspace()
        PrivateGroupInvite.objects.filter(
            invitee=request.user,
            workspace=workspace,
            status="pending",
            expires_at__lte=timezone.now(),
        ).update(status="expired")

        try:
            invite = PrivateGroupInvite.objects.get(
                id=pk, invitee=request.user, workspace=workspace
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
                ChannelMember.objects.update_or_create(
                    channel=channel,
                    user=request.user,
                    defaults={"role": "member", "is_active": True, "left_at": None},
                )
                if channel.is_pending:
                    if (
                        ChannelMember.objects.filter(
                            channel=channel, is_active=True
                        ).count()
                        >= 2
                    ):
                        channel.is_pending = False
                        channel.save()
            except Exception:
                pass

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


class CleanupPendingGroupsView(WorkspaceBaseView):
    required_permission = "manage_channels"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        from chat.models import Channel, ChannelMember

        cutoff = timezone.now() - timedelta(hours=24)
        pending_groups = Channel.objects.filter(
            workspace=workspace,
            channel_type="private_group",
            is_pending=True,
            created_at__lte=cutoff,
        )

        deleted = []
        for group in pending_groups:
            if ChannelMember.objects.filter(channel=group, is_active=True).count() < 2:
                try:
                    NotificationService.create_and_emit(
                        WorkspaceEvent(
                            actor_id=request.user.id,
                            workspace_id=workspace.id,
                            event_description=f"Group '{group.name}' was deleted: not enough members joined within 24 hours.",
                            member_ids=[group.owner_id] if group.owner_id else [],
                        )
                    )
                except Exception:
                    pass
                group.delete()
                deleted.append(group.name)

        return Response({"deleted_groups": deleted, "count": len(deleted)})


class LeaveWorkspaceView(WorkspaceBaseView):
    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=404)

        if membership.role == "owner":
            return Response(
                {
                    "error": "Workspace owners cannot leave. Transfer ownership or delete the workspace."
                },
                status=403,
            )

        WorkspaceService.leave_workspace(workspace, request.user)

        try:
            from notifications.models import Notification

            Notification.objects.filter(
                recipient=request.user, workspace=workspace, status="unread"
            ).update(status="archived")
        except Exception:
            pass

        try:
            from chat.models import DMRequest

            DMRequest.objects.filter(workspace=workspace, status="pending").filter(
                models.Q(sender=request.user) | models.Q(receiver=request.user)
            ).update(status="expired")
        except Exception:
            pass

        return Response({"message": f"You have left {workspace.name}."})
