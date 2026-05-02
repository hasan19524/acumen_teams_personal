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

    record, created = Attendance.objects.get_or_create(
        user=user,
        date=today
    )

    if record.check_in:
        return Response({"error": "Already checked in today"}, status=400)

    record.check_in = timezone.now()
    record.save()

    return Response({"message": "Checked in successfully"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    user = request.user
    today = timezone.localdate()

    try:
        record = Attendance.objects.get(user=user, date=today)
    except Attendance.DoesNotExist:
        return Response({"error": "Check in first"}, status=400)

    if record.check_out:
        return Response({"error": "Already checked out"}, status=400)

    record.check_out = timezone.now()
    record.save()

    return Response({"message": "Checked out successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_attendance(request):
    records = Attendance.objects.filter(user=request.user).order_by("-date")[:7]

    data = []

    for r in records:
        data.append({
            "date": r.date,
            "check_in": r.check_in,
            "check_out": r.check_out,
        })

    return Response(data)