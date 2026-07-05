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
from django.db.models import Sum, F, ExpressionWrapper, DurationField
from django.db.models.functions import TruncDate
from datetime import timedelta
from .serializers import ProfileSerializer
from .models import ClockEntry, Profile
from django.utils import timezone


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

    # Determine onboarding mode. Backend is the source of truth.
    onboarding_mode = data.get("onboarding_mode", "JOIN_COMPANY").upper()
    ws_id = None

    if onboarding_mode == "START_COMPANY":
        # Use WorkspaceService to properly provision System Teams and Chats
        ws_name = (
            company_name or data.get("workspace_name") or f"{username}'s Workspace"
        )
        workspace = WorkspaceService.create_workspace(name=ws_name, owner=user)
        ws_id = workspace.id

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
            "workspace_id": ws_id,  # Returns null for JOIN_COMPANY
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


def build_user_response(user, profile, membership):
    """Helper to build a bulletproof JSON response for the frontend."""
    avatar_url = None
    if profile.profile_image:
        try:
            avatar_url = profile.profile_image.url
        except Exception:
            avatar_url = None

    ws_logo_url = None
    ws_owner = None
    ws_description = ""
    ws_created_at = None
    role = membership.role if membership else None
    
    if membership and membership.workspace:
        try:
            if membership.workspace.logo:
                ws_logo_url = membership.workspace.logo.url
        except Exception:
            ws_logo_url = None
        ws_owner = membership.workspace.owner.username
        ws_description = membership.workspace.description or ""
        ws_created_at = membership.workspace.created_at.isoformat() if membership.workspace.created_at else None
        
        # FIX: If the user is a standard member, check if they lead any team.
        # If so, dynamically upgrade their role to "leader" for the frontend.
        if role == "member":
            from workspaces.models import TeamMembership
            if TeamMembership.objects.filter(user=user, is_leader=True, is_active=True).exists():
                role = "leader"

    return Response({
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}".strip() or user.username,
        "role": role,
        "company_name": membership.workspace.name if membership else "",
        "workspace_id": membership.workspace.id if membership else None,
        "joined_at": membership.joined_at.isoformat() if membership and membership.joined_at else None,
        "date_joined": user.date_joined.isoformat(),
        "avatar_url": avatar_url,
        "profile_image": avatar_url,  # Added for settings page compatibility
        "workspace_logo": ws_logo_url,
        "workspace_description": ws_description,
        "workspace_owner": ws_owner,
        "workspace_created_at": ws_created_at,
        "bio": profile.bio,
        "phone_number": profile.phone_number,
        "designation": profile.designation,
        "notification_preferences": profile.notification_preferences,
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    profile, created = Profile.objects.get_or_create(user=user)
    membership = user.memberships.filter(is_active=True).select_related("workspace").first()
    return build_user_response(user, profile, membership)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def me_update(request):
    user = request.user
    profile, created = Profile.objects.get_or_create(user=user)
    
    # 1. Update User fields manually
    if 'first_name' in request.data:
        user.first_name = request.data.get('first_name', '')
    if 'last_name' in request.data:
        user.last_name = request.data.get('last_name', '')
    if 'email' in request.data:
        user.email = request.data.get('email', user.email)
    user.save()

    # 2. Update Profile fields manually
    if 'bio' in request.data:
        profile.bio = request.data.get('bio')
    if 'phone_number' in request.data:
        profile.phone_number = request.data.get('phone_number')
    if 'designation' in request.data:
        profile.designation = request.data.get('designation')
    if 'notification_preferences' in request.data:
        profile.notification_preferences = request.data.get('notification_preferences')

    # 3. Handle Avatar Upload
    # NOTE: We don't delete the old image here. The Profile model's save() method
    # automatically detects the change and deletes the old file from S3.
    if 'profile_image' in request.FILES:
        profile.profile_image = request.FILES['profile_image']
    
    profile.save()

    # 4. Return the exact same response as `me` to keep frontend happy
    membership = user.memberships.filter(is_active=True).select_related("workspace").first()
    return build_user_response(user, profile, membership)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")
    
    if not current_password or not new_password:
        return Response({"error": "Current and new password are required."}, status=status.HTTP_400_BAD_REQUEST)
        
    if not user.check_password(current_password):
        return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters long."}, status=status.HTTP_400_BAD_REQUEST)
        
    user.set_password(new_password)
    user.save()
    return Response({"message": "Password changed successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def clock_status(request):
    today = timezone.now().date()
    entries = ClockEntry.objects.filter(user=request.user, clock_in__date=today)
    active_entry = entries.filter(clock_out__isnull=True).first()

    total_seconds = 0
    for entry in entries:
        end_time = entry.clock_out if entry.clock_out else timezone.now()
        total_seconds += (end_time - entry.clock_in).total_seconds()

    return Response(
        {
            "is_clocked_in": bool(active_entry),
            "last_clock_in": entries.first().clock_in if entries.exists() else None,
            "last_clock_out": (
                entries.exclude(clock_out__isnull=True).first().clock_out
                if entries.exclude(clock_out__isnull=True).exists()
                else None
            ),
            "total_seconds_today": total_seconds,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def clock_in(request):
    active = ClockEntry.objects.filter(
        user=request.user, clock_out__isnull=True
    ).first()
    if active:
        return Response({"error": "Already clocked in"}, status=400)
    entry = ClockEntry.objects.create(user=request.user)
    return Response({"message": "Clocked in", "clock_in": entry.clock_in})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def clock_out(request):
    active = ClockEntry.objects.filter(
        user=request.user, clock_out__isnull=True
    ).first()
    if not active:
        return Response({"error": "Not clocked in"}, status=400)
    active.clock_out = timezone.now()
    active.save()
    return Response({"message": "Clocked out", "clock_out": active.clock_out})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def clock_history(request):
    """Returns daily aggregated clock history for the personal dashboard."""
    entries = (
        ClockEntry.objects.filter(user=request.user)
        .annotate(date=TruncDate("clock_in"))
        .values("date")
        .annotate(
            total_duration=Sum(
                ExpressionWrapper(
                    F("clock_out") - F("clock_in"), output_field=DurationField()
                )
            )
        )
        .order_by("-date")
    )

    data = []
    for entry in entries:
        total_seconds = (
            entry["total_duration"].total_seconds() if entry["total_duration"] else 0
        )
        data.append(
            {
                "date": entry["date"].isoformat(),
                "total_hours": round(total_seconds / 3600, 2),
                "total_seconds": total_seconds,
            }
        )
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile(request, user_id):
    """Fetches the full profile of any user within a shared workspace."""
    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    profile, _ = Profile.objects.get_or_create(user=target_user)
    
    # Only return data if they share an active workspace
    membership = (
        target_user.memberships.filter(
            is_active=True, 
            workspace__memberships__user=request.user, 
            workspace__memberships__is_active=True
        ).select_related("workspace").first()
    )
    
    if not membership:
        return Response({"error": "You do not have permission to view this profile."}, status=403)
        
    return build_user_response(target_user, profile, membership)