from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from .models import Attendance


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkin(request: Request, workspace_id: int) -> Response:
    user: User = request.user
    today = timezone.localdate()

    # Auto-checkout any previous active sessions (forgot to check out)
    previous_active = Attendance.objects.filter(
        user=user,
        check_in__isnull=False,
        check_out__isnull=True,
    ).exclude(date=today)

    for session in previous_active:
        if session.check_in:
            session.check_out = session.check_in + timedelta(hours=8)
            session.duration = timedelta(hours=8)
            session.save()

    record, created = Attendance.objects.get_or_create(
        user=user, workspace_id=workspace_id, date=today
    )

    if record.check_in:
        return Response({"error": "Already checked in today"}, status=400)

    record.check_in = timezone.now()
    record.save()

    return Response(
        {
            "message": "Checked in successfully",
            "check_in": record.check_in.isoformat(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request: Request, workspace_id: int) -> Response:
    user: User = request.user
    today = timezone.localdate()

    try:
        record = Attendance.objects.get(
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
    record.save()

    hours = record.duration.total_seconds() / 3600 if record.duration else 0.0
    return Response(
        {
            "message": "Checked out successfully",
            "check_out": record.check_out.isoformat(),
            "duration_hours": round(hours, 2),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_attendance(request: Request, workspace_id: int) -> Response:
    user: User = request.user
    today = timezone.localdate()

    # Calculate working days in the current month up to today
    first_day_of_month = today.replace(day=1)
    days_in_month = (today - first_day_of_month).days + 1
    working_days = 0
    for i in range(days_in_month):
        current_day = first_day_of_month + timedelta(days=i)
        if current_day.weekday() < 5:  # 0-4 are Mon-Fri
            working_days += 1

    # Count days checked in this month
    checked_in_days = Attendance.objects.filter(
        user=user,
        workspace_id=workspace_id,
        date__year=today.year,
        date__month=today.month,
        check_in__isnull=False,
    ).count()

    percentage: float = (
        (checked_in_days / working_days * 100) if working_days > 0 else 0.0
    )

    records = Attendance.objects.filter(user=user, workspace_id=workspace_id).order_by(
        "-date"
    )[:7]

    data = []
    for r in records:
        duration_hours = None
        if r.duration:
            duration_hours = round(r.duration.total_seconds() / 3600, 2)
        elif r.check_in and not r.check_out:
            elapsed = (timezone.now() - r.check_in).total_seconds()
            elapsed = min(elapsed, 86400)  # Cap at 24h
            duration_hours = round(elapsed / 3600, 2)

        data.append(
            {
                "date": r.date.isoformat(),
                "check_in": r.check_in.isoformat() if r.check_in else None,
                "check_out": r.check_out.isoformat() if r.check_out else None,
                "duration_hours": duration_hours,
                "is_today": r.date == today,
            }
        )

    return Response({"attendance_percentage": round(percentage, 1), "records": data})
