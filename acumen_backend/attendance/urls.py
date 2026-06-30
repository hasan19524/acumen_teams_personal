# acumen_backend/attendance/urls.py
from django.urls import path
from .views import checkin, checkout, my_attendance, team_attendance, attendance_config

urlpatterns = [
    path("<int:workspace_id>/checkin/", checkin, name="checkin"),
    path("<int:workspace_id>/checkout/", checkout, name="checkout"),
    path("<int:workspace_id>/me/", my_attendance, name="my-attendance"),
    path("<int:workspace_id>/team/", team_attendance, name="team-attendance"),
    path("<int:workspace_id>/config/", attendance_config, name="attendance-config"),
]
