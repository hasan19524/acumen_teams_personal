from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from django.utils import timezone
from datetime import timedelta

from .models import (
    Workspace,
    Team,
    WorkspaceMembership,
    WorkspaceInvite,
    TeamMembership,
    ROLE_PERMISSIONS,
)
from .permissions import require_permission


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
            TeamMembership.objects.filter(user=request.user)
            .select_related("team__leader")
            .first()
        )

        if not team_membership:
            return Response({"team": None})

        team = team_membership.team
        members = TeamMembership.objects.filter(team=team).select_related("user")

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
                    "member_count": TeamMembership.objects.filter(team=t).count(),
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
                    "team": TeamMembership.objects.filter(user=m.user)
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
            TeamMembership.objects.get_or_create(team=team, user=leader)

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
            TeamMembership.objects.get_or_create(team=team, user=target_user)

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
            # Remove from all current teams first
            TeamMembership.objects.filter(user=target.user).delete()

            if team_id is not None:
                try:
                    team = Team.objects.get(id=team_id, workspace=membership.workspace)
                    TeamMembership.objects.get_or_create(team=team, user=target.user)
                    # If manager, set as team leader
                    if role == "manager" or target.role == "manager":
                        team.leader = target.user
                        team.save()
                except Team.DoesNotExist:
                    return Response({"error": "Team not found"}, status=404)

        team_name = (
            TeamMembership.objects.filter(user=target.user)
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
        expires_hours = int(request.data.get("expires_hours", 72))
        max_uses = int(request.data.get("max_uses", 0))

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

        try:
            from chat.models import Channel, ChannelMember

            general = Channel.objects.filter(
                workspace=invite.workspace, name__iexact="general"
            ).first()
            if general:
                ChannelMember.objects.get_or_create(
                    channel=general, user=request.user, defaults={"role": "member"}
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
