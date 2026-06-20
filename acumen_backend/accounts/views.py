# acumen_backend/accounts/views.py
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.throttling import AnonRateThrottle
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from workspaces.services import WorkspaceService
from workspaces.models import WorkspaceMembership


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    data = request.data

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    company_name = data.get("company_name", "").strip()

    if not username or not email or not password:
        return Response(
            {"error": "Username, email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "This username is already taken."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    name_parts = full_name.split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    # Use WorkspaceService to properly provision System Teams and Chats
    workspace = WorkspaceService.create_workspace(
        name=company_name or f"{username}'s Workspace", owner=user
    )

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "message": "Account created successfully!",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "email": user.email,
            "full_name": f"{user.first_name} {user.last_name}".strip(),
            "user_id": user.id,
            "workspace_id": workspace.id,  # CRITICAL: Provide workspace_id to frontend
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def login_user(request):
    data = request.data
    login_input = data.get("login", "").strip()
    password = data.get("password", "")

    if not login_input or not password:
        return Response(
            {"error": "Please provide your email/username and password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_candidate = None
    if "@" in login_input:
        try:
            user_candidate = User.objects.get(email=login_input)
        except User.DoesNotExist:
            pass
    else:
        try:
            user_candidate = User.objects.get(username=login_input)
        except User.DoesNotExist:
            pass

    if not user_candidate or not user_candidate.check_password(password):
        return Response(
            {
                "error": "Invalid credentials. Please check your email/username and password."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Fetch the user's active workspace to provide ID to frontend
    membership = (
        user_candidate.memberships.filter(is_active=True)
        .select_related("workspace")
        .first()
    )
    workspace_id = membership.workspace.id if membership else None

    refresh = RefreshToken.for_user(user_candidate)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user_candidate.username,
            "email": user_candidate.email,
            "full_name": f"{user_candidate.first_name} {user_candidate.last_name}".strip(),
            "user_id": user_candidate.id,
            "workspace_id": workspace_id,  # CRITICAL: Provide workspace_id to frontend
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    try:
        membership = (
            user.memberships.filter(is_active=True).select_related("workspace").first()
        )
        if membership:
            role = membership.role
            company_name = membership.workspace.name
            ws_id = membership.workspace.id
        else:
            role = None
            company_name = ""
            ws_id = None

        full_name = f"{user.first_name} {user.last_name}".strip()
    except Exception:
        role = None
        company_name = ""
        ws_id = None
        full_name = f"{user.first_name} {user.last_name}".strip()

    return Response(
        {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": full_name or user.username,
            "role": role,
            "company_name": company_name,
            "workspace_id": ws_id,  # Also return it here for safety
        }
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def me_update(request):
    user = request.user
    full_name = request.data.get("full_name", "").strip()
    email = request.data.get("email", "").strip()

    if full_name:
        parts = full_name.split(" ", 1)
        user.first_name = parts[0]
        user.last_name = parts[1] if len(parts) > 1 else ""

    if email and email != user.email:
        if User.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response(
                {"error": "This email is already in use."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.email = email

    user.save()
    return Response(
        {
            "message": "Profile updated.",
            "full_name": f"{user.first_name} {user.last_name}".strip(),
            "email": user.email,
        }
    )
