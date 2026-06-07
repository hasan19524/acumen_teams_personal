from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from .models import Attendance


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkin(request):
    user = request.user
    today = timezone.localdate()

    # Auto-checkout any previous active sessions (forgot to check out)
    previous_active = Attendance.objects.filter(
        user=user,
        check_in__isnull=False,
        check_out__isnull=True,
    ).exclude(date=today)

    for session in previous_active:
        session.check_out = session.check_in + timedelta(hours=8)
        session.duration = timedelta(hours=8)
        session.save()

    record, created = Attendance.objects.get_or_create(
        user=user,
        date=today,
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
def checkout(request):
    user = request.user
    today = timezone.localdate()

    try:
        record = Attendance.objects.get(user=user, date=today)
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

    hours = record.duration.total_seconds() / 3600
    return Response(
        {
            "message": "Checked out successfully",
            "check_out": record.check_out.isoformat(),
            "duration_hours": round(hours, 2),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_attendance(request):
    user = request.user
    today = timezone.localdate()

    records = Attendance.objects.filter(user=user).order_by("-date")[:7]

    data = []
    for r in records:
        duration_hours = None
        if r.duration:
            duration_hours = round(r.duration.total_seconds() / 3600, 2)
        elif r.check_in and not r.check_out:
            elapsed = (timezone.now() - r.check_in).total_seconds()
            # Cap at 24 hours to prevent extremely wrong values
            elapsed = min(elapsed, 86400)
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

    return Response(data)
