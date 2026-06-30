# acumen_backend/attendance/views.py
from datetime import timedelta, time
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from .models import Attendance, WorkspaceAttendanceConfig
from workspaces.models import WorkspaceMembership, TeamMembership, Team


def get_config(workspace_id: int) -> WorkspaceAttendanceConfig:
    config, created = WorkspaceAttendanceConfig.objects.get_or_create(
        workspace_id=workspace_id
    )
    return config


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkin(request: Request, workspace_id: int) -> Response:
    user = request.user
    today = timezone.localdate()
    now = timezone.now()

    if not WorkspaceMembership.objects.filter(
        user_id=user.id, workspace_id=workspace_id, is_active=True
    ).exists():
        return Response({"error": "Not authorized for this workspace"}, status=403)

    config = get_config(workspace_id)

    previous_active = Attendance.objects.filter(
        user=user, check_in__isnull=False, check_out__isnull=True
    ).exclude(date=today)

    for session in previous_active:
        if session.check_in:
            session.check_out = session.check_in + timedelta(hours=8)
            session.duration = timedelta(hours=8)
            session.status = "half_day"
            session.is_half_day = True
            session.save()

    with transaction.atomic():
        record, created = Attendance.objects.select_for_update().get_or_create(
            user=user, workspace_id=workspace_id, date=today
        )

        if record.check_in:
            return Response({"error": "Already checked in today"}, status=400)

        record.check_in = now
        shift_start_dt = timezone.make_aware(
            timezone.datetime.combine(today, config.shift_start)
        )
        if now > shift_start_dt + timedelta(minutes=config.grace_period_minutes):
            record.status = "late"
            record.is_late = True
        else:
            record.status = "present"
        record.save()

    return Response({"message": "Checked in successfully", "status": record.status})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request: Request, workspace_id: int) -> Response:
    user = request.user
    today = timezone.localdate()

    if not WorkspaceMembership.objects.filter(
        user_id=user.id, workspace_id=workspace_id, is_active=True
    ).exists():
        return Response({"error": "Not authorized for this workspace"}, status=403)

    with transaction.atomic():
        try:
            record = Attendance.objects.select_for_update().get(
                user=user, workspace_id=workspace_id, date=today
            )
        except Attendance.DoesNotExist:
            return Response({"error": "Check in first"}, status=400)

        if not record.check_in:
            return Response({"error": "Check in first"}, status=400)
        if record.check_out:
            return Response({"error": "Already checked out"}, status=400)

        now = timezone.now()
        record.check_out = now
        record.duration = now - record.check_in
        config = get_config(workspace_id)

        if record.duration < config.half_day_threshold:
            record.is_half_day = True
            record.status = "half_day"
        else:
            record.status = "late" if record.is_late else "present"
        record.save()

    return Response({"message": "Checked out successfully", "status": record.status})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_attendance(request: Request, workspace_id: int) -> Response:
    user = request.user
    today = timezone.localdate()
    config = get_config(workspace_id)

    if not WorkspaceMembership.objects.filter(
        user_id=user.id, workspace_id=workspace_id, is_active=True
    ).exists():
        return Response({"error": "Not authorized"}, status=403)

    first_day_of_month = today.replace(day=1)
    days_in_month = (today - first_day_of_month).days + 1
    working_days = sum(
        1
        for i in range(days_in_month)
        if config.is_working_day(first_day_of_month + timedelta(days=i))
    )

    checked_in_days = Attendance.objects.filter(
        user=user,
        workspace_id=workspace_id,
        date__year=today.year,
        date__month=today.month,
        status__in=["present", "late", "half_day"],
    ).count()

    percentage = (checked_in_days / working_days * 100) if working_days > 0 else 0.0

    records = Attendance.objects.filter(user=user, workspace_id=workspace_id).order_by(
        "-date"
    )[:30]
    data = []
    for r in records:
        duration_hours = (
            round(r.duration.total_seconds() / 3600, 2)
            if r.duration
            else (
                round((timezone.now() - r.check_in).total_seconds() / 3600, 2)
                if r.check_in and not r.check_out
                else None
            )
        )
        data.append(
            {
                "date": r.date.isoformat(),
                "check_in": r.check_in.isoformat() if r.check_in else None,
                "check_out": r.check_out.isoformat() if r.check_out else None,
                "duration_hours": duration_hours,
                "status": r.status,
                "is_today": r.date == today,
            }
        )

    return Response({"attendance_percentage": round(percentage, 1), "records": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def team_attendance(request: Request, workspace_id: int) -> Response:
    user = request.user
    today = timezone.localdate()

    membership = WorkspaceMembership.objects.filter(
        user_id=user.id, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership or membership.role not in ("leader", "admin", "owner"):
        return Response({"error": "Not authorized"}, status=403)

    if membership.role in ("admin", "owner"):
        teams = Team.objects.filter(workspace_id=workspace_id)
    else:
        leader_team_ids = TeamMembership.objects.filter(
            user=user, is_active=True, is_leader=True
        ).values_list("team_id", flat=True)
        teams = Team.objects.filter(id__in=leader_team_ids, workspace_id=workspace_id)

    team_data = []
    active_ws_memberships = list(
        WorkspaceMembership.objects.filter(
            workspace_id=workspace_id, is_active=True
        ).select_related("user")
    )
    active_ws_user_ids = {m.user_id for m in active_ws_memberships}

    today_attendances = {
        att.user_id: att
        for att in Attendance.objects.filter(workspace_id=workspace_id, date=today)
    }

    for team in teams:
        members = (
            active_ws_memberships
            if team.name == "General"
            else list(
                TeamMembership.objects.filter(
                    team=team, is_active=True, user_id__in=active_ws_user_ids
                ).select_related("user")
            )
        )

        member_attendance = []
        present_count = 0
        absent_count = 0

        for m in members:
            att = today_attendances.get(m.user_id)
            status = att.status if att else "absent"
            if status in ["present", "late", "half_day"]:
                present_count += 1
            else:
                absent_count += 1

            member_attendance.append(
                {
                    "user_id": m.user.id,
                    "username": m.user.username,
                    "full_name": m.user.get_full_name() or m.user.username,
                    "status": status,
                }
            )

        total_members = len(member_attendance)
        present_percentage = (
            round((present_count / total_members) * 100, 0) if total_members > 0 else 0
        )

        team_data.append(
            {
                "team_id": team.id,
                "team_name": team.name,
                "total_members": total_members,
                "present_count": present_count,
                "absent_count": absent_count,
                "present_percentage": present_percentage,
                "members": member_attendance,
            }
        )

    return Response({"teams": team_data})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def attendance_config(request: Request, workspace_id: int) -> Response:
    membership = WorkspaceMembership.objects.filter(
        user_id=request.user.id, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership or membership.role not in ("owner", "admin"):
        return Response({"error": "Not authorized"}, status=403)

    config = get_config(workspace_id)

    if request.method == "POST":
        config.shift_start = request.data.get("shift_start", config.shift_start)
        config.shift_end = request.data.get("shift_end", config.shift_end)
        config.grace_period_minutes = int(
            request.data.get("grace_period_minutes", config.grace_period_minutes)
        )
        config.working_days = request.data.get("working_days", config.working_days)
        config.save()
        return Response({"message": "Configuration updated successfully"})

    return Response(
        {
            "shift_start": config.shift_start.isoformat(),
            "shift_end": config.shift_end.isoformat(),
            "grace_period_minutes": config.grace_period_minutes,
            "working_days": config.working_days.split(","),
        }
    )
