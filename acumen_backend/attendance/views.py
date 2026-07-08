from datetime import timedelta, time
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from .models import Attendance, WorkspaceAttendanceConfig
from workspaces.models import WorkspaceMembership, TeamMembership, Team, TeamType


def get_config(workspace_id: int) -> WorkspaceAttendanceConfig:
    config, created = WorkspaceAttendanceConfig.objects.get_or_create(
        workspace_id=workspace_id
    )
    return config


def auto_clock_out_previous_sessions(user, workspace_id):
    """Automatically clocks out any forgotten sessions from previous days."""
    config = get_config(workspace_id)
    previous_active = Attendance.objects.filter(
        user=user, check_in__isnull=False, check_out__isnull=True
    ).exclude(date=timezone.localdate())

    for session in previous_active:
        shift_end_dt = timezone.make_aware(
            timezone.datetime.combine(session.date, config.shift_end)
        )
        session.check_out = shift_end_dt
        session.duration = shift_end_dt - session.check_in
        session.clock_out_reason = "AUTO_SHIFT_END"

        if session.duration < config.half_day_threshold:
            session.is_half_day = True
            session.status = "half_day"
        else:
            session.status = "late" if session.is_late else "present"
        session.save()


def get_attendance_state(user, workspace_id, config):
    """Determines the current UI state for the user based on backend rules."""
    today = timezone.localdate()
    now = timezone.now()

    # 1. Check Non-Working Day
    if not config.is_working_day(today):
        return {
            "state": "NON_WORKING_DAY",
            "can_clock_in": False,
            "can_clock_out": False,
            "message": "Enjoy your weekend. Work resumes on your next working day.",
            "attendance_status": "Holiday",
        }

    # Get today's record
    record = Attendance.objects.filter(
        user=user, workspace_id=workspace_id, date=today
    ).first()

    # 2. Lazy Auto-Clock-Out mechanism for today if shift has ended
    shift_end_dt = timezone.make_aware(
        timezone.datetime.combine(today, config.shift_end)
    )
    if record and record.check_in and not record.check_out:
        if now > shift_end_dt:
            with transaction.atomic():
                record.check_out = shift_end_dt
                record.duration = shift_end_dt - record.check_in
                record.clock_out_reason = "AUTO_SHIFT_END"
                if record.duration < config.half_day_threshold:
                    record.is_half_day = True
                    record.status = "half_day"
                else:
                    record.status = "late" if record.is_late else "present"
                record.save()

    # 3. Determine Shift Completed State
    if record and record.check_out:
        return {
            "state": "SHIFT_COMPLETED",
            "can_clock_in": False,
            "can_clock_out": False,
            "message": "Great work today. See you tomorrow.",
            "attendance_status": record.status,
        }

    # 4. Determine Working State
    if record and record.check_in:
        return {
            "state": "WORKING",
            "can_clock_in": False,
            "can_clock_out": True,
            "message": "Currently working.",
            "attendance_status": record.status,
        }

    # 5. Determine Pre-Shift vs Awaiting Clock In
    shift_start_dt = timezone.make_aware(
        timezone.datetime.combine(today, config.shift_start)
    )
    if now < shift_start_dt:
        return {
            "state": "PRE_SHIFT",
            "can_clock_in": False,
            "can_clock_out": False,
            "message": f"Your shift starts at {config.shift_start.strftime('%I:%M %p')}.",
            "attendance_status": "Absent",
        }

    return {
        "state": "AWAITING_CLOCK_IN",
        "can_clock_in": True,
        "can_clock_out": False,
        "message": "You haven't clocked in yet.",
        "attendance_status": "Absent",
    }


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

    # Fix forgotten sessions from previous days
    auto_clock_out_previous_sessions(user, workspace_id)

    # Backend Shift Enforcement: Prevent early clock-in
    shift_start_dt = timezone.make_aware(
        timezone.datetime.combine(today, config.shift_start)
    )
    if now < shift_start_dt:
        return Response(
            {"error": "Cannot clock in before shift start time."}, status=400
        )

    with transaction.atomic():
        record, created = Attendance.objects.select_for_update().get_or_create(
            user=user, workspace_id=workspace_id, date=today
        )

        if record.check_in:
            return Response({"error": "Already checked in today"}, status=400)

        record.check_in = now
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

    config = get_config(workspace_id)

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
        record.clock_out_reason = "MANUAL"  # Set reason to Manual
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

    # Fix forgotten sessions from previous days
    auto_clock_out_previous_sessions(user, workspace_id)

    # Get user's join date to prevent showing history before they joined
    ws_membership = WorkspaceMembership.objects.filter(user=user, workspace_id=workspace_id, is_active=True).first()
    join_date = ws_membership.joined_at.date() if ws_membership else today

    # Get dynamic state from backend
    state_data = get_attendance_state(user, workspace_id, config)

    # Calculate percentage based on days passed UP TO TODAY
    first_day_of_month = today.replace(day=1)
    days_passed = (today - first_day_of_month).days + 1
    working_days_passed = sum(
        1
        for i in range(days_passed)
        if config.is_working_day(first_day_of_month + timedelta(days=i))
    )

    checked_in_days = Attendance.objects.filter(
        user=user,
        workspace_id=workspace_id,
        date__year=today.year,
        date__month=today.month,
        date__lte=today,  # Only count up to today
        status__in=["present", "late", "half_day"],
    ).count()

    percentage = (
        (checked_in_days / working_days_passed * 100)
        if working_days_passed > 0
        else 0.0
    )

    # Dynamically generate last 30 days history
    records_qs = Attendance.objects.filter(user=user, workspace_id=workspace_id)
    record_map = {r.date: r for r in records_qs}
    
    data = []
    for i in range(30):
        date = today - timedelta(days=i)
        
        # FIX: Don't show history before the user joined the workspace
        if date < join_date:
            continue
            
        is_working_day = config.is_working_day(date)
        record = record_map.get(date)

        if record:
            duration_hours = (
                round(record.duration.total_seconds() / 3600, 2)
                if record.duration
                else (
                    round((timezone.now() - record.check_in).total_seconds() / 3600, 2)
                    if record.check_in and not record.check_out
                    else None
                )
            )
            data.append({
                "date": date.isoformat(),
                "check_in": record.check_in.isoformat() if record.check_in else None,
                "check_out": record.check_out.isoformat() if record.check_out else None,
                "duration_hours": duration_hours,
                "status": record.status,
                "clock_out_reason": record.clock_out_reason,
                "is_today": date == today,
            })
        elif is_working_day:
            # Explicitly mark as absent if it was a working day
            data.append({
                "date": date.isoformat(),
                "check_in": None,
                "check_out": None,
                "duration_hours": None,
                "status": "absent",
                "clock_out_reason": None,
                "is_today": date == today,
            })
        # Skip weekends/holidays if no record exists

    # ── 14-DAY (Cycle) PRECISION CALCULATION ──
    cycle_days = config.productivity_cycle_days
    start_date_cycle = today - timedelta(days=cycle_days - 1)
    
    # 1. Calculate working days since the user joined (up to today)
    working_days_since_join = 0
    for i in range(cycle_days):
        date = today - timedelta(days=i)
        if date < join_date:
            continue # Skip days before the user joined
        if config.is_working_day(date):
            working_days_since_join += 1

    # 2. Count present days in the cycle
    cycle_present = Attendance.objects.filter(
        user=user,
        workspace_id=workspace_id,
        date__gte=start_date_cycle,
        date__lte=today,
        status__in=["present", "late", "half_day"]
    ).count()
    
    # 3. Calculate precise absent days and percentage
    cycle_absent = max(0, working_days_since_join - cycle_present)
    cycle_percentage = round((cycle_present / working_days_since_join) * 100, 0) if working_days_since_join > 0 else 0

    return Response({
            "attendance_percentage": round(percentage, 1),
            "records": data,
            "state": state_data["state"],
            "can_clock_in": state_data["can_clock_in"],
            "can_clock_out": state_data["can_clock_out"],
            "state_message": state_data["message"],
            "attendance_status": state_data["attendance_status"],
            "shift_start": config.shift_start.isoformat(),
            "shift_end": config.shift_end.isoformat(),
            # NEW: Precise 14-day stats for the dashboard widget
            "present_days_14d": cycle_present,
            "absent_days_14d": cycle_absent,
            "attendance_percentage_14d": cycle_percentage,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def team_attendance(request: Request, workspace_id: int) -> Response:
    user = request.user
    today = timezone.localdate()
    config = get_config(workspace_id) # FIX: Added missing config

    membership = WorkspaceMembership.objects.filter(
        user_id=user.id, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership or membership.role not in ("leader", "admin", "owner"):
        return Response({"error": "Not authorized"}, status=403)

    # FIX: Exclude all system teams (General, Management, Unassigned) from attendance view
    system_teams = [TeamType.GENERAL, TeamType.MANAGEMENT, TeamType.UNASSIGNED]
    if membership.role in ("admin", "owner"):
        teams = Team.objects.filter(workspace_id=workspace_id).exclude(team_type__in=system_teams).exclude(name__iexact="General")
    else:
        leader_team_ids = TeamMembership.objects.filter(
            user=user, is_active=True, is_leader=True
        ).values_list("team_id", flat=True)
        teams = Team.objects.filter(id__in=leader_team_ids, workspace_id=workspace_id).exclude(team_type__in=system_teams).exclude(name__iexact="General")

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
            status = att.status if att and att.check_in else "absent"
            if status in ["present", "late", "half_day"]:
                present_count += 1
            else:
                absent_count += 1

            avatar_url = None
            try:
                if hasattr(m.user, "profile") and m.user.profile.profile_image:
                    avatar_url = request.build_absolute_uri(
                        m.user.profile.profile_image.url
                    )
            except Exception:
                pass

            role = getattr(m, "role", "member")

            member_attendance.append(
                {
                    "user_id": m.user.id,
                    "username": m.user.username,
                    "full_name": m.user.get_full_name() or m.user.username,
                    "role": role,
                    "profile_image": avatar_url,
                    "status": status,
                    "check_in": (
                        att.check_in.isoformat() if att and att.check_in else None
                    ),
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

    # Calculate Cycle Stats for Teams
    cycle_days = config.productivity_cycle_days
    start_date_cycle = today - timedelta(days=cycle_days - 1)
    
    # Create a map of user_id -> join_date for all active workspace members
    user_join_dates = {m.user_id: m.joined_at.date() for m in active_ws_memberships if m.joined_at}

    for team in team_data:
        team_present_total = 0
        team_working_days_total = 0
        
        for m in team["members"]:
            join_date = user_join_dates.get(m["user_id"], today)
            
            # Calculate working days in cycle SINCE the user joined
            working_days_since_join = 0
            for i in range(cycle_days):
                date = today - timedelta(days=i)
                if date < join_date:
                    continue # Skip days before the user joined
                if config.is_working_day(date):
                    working_days_since_join += 1

            user_attendance = Attendance.objects.filter(
                user_id=m["user_id"], workspace_id=workspace_id, date__gte=start_date_cycle, date__lte=today, status__in=["present", "late", "half_day"]
            )
            present_count = user_attendance.count()
            absent_count = max(0, working_days_since_join - present_count)
            percentage = round((present_count / working_days_since_join) * 100, 0) if working_days_since_join > 0 else 0

            m["cycle_present"] = present_count
            m["cycle_absent"] = absent_count
            m["cycle_percentage"] = percentage
            
            # Generate history for the member (only from join date onwards)
            member_record_map = {r.date: r for r in user_attendance}
            member_history = []
            for i in range(cycle_days):
                date = today - timedelta(days=i)
                
                if date < join_date:
                    continue # Skip days before the user joined
                    
                is_working_day = config.is_working_day(date)
                record = member_record_map.get(date)
                
                if record:
                    member_history.append({
                        "date": date.isoformat(),
                        "status": record.status,
                        "check_in": record.check_in.isoformat() if record.check_in else None,
                    })
                elif is_working_day:
                    member_history.append({
                        "date": date.isoformat(),
                        "status": "absent",
                        "check_in": None,
                    })
            m["history"] = member_history

            team_present_total += present_count
            team_working_days_total += working_days_since_join

        team["present_count"] = team_present_total
        team["absent_count"] = max(0, team_working_days_total - team_present_total)
        team["present_percentage"] = round((team_present_total / team_working_days_total) * 100, 0) if team_working_days_total > 0 else 0

    return Response({"teams": team_data, "cycle_days": cycle_days})

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
        config.productivity_cycle_days = int(request.data.get("productivity_cycle_days", config.productivity_cycle_days))
        config.save()
        return Response({"message": "Configuration updated successfully"})

    return Response(
        {
            "shift_start": config.shift_start.isoformat(),
            "shift_end": config.shift_end.isoformat(),
            "grace_period_minutes": config.grace_period_minutes,
            "working_days": config.working_days.split(","),
            "productivity_cycle_days": config.productivity_cycle_days,
        }
    )
