# acumen_backend/attendance/urls.py
from django.urls import path
from .views import checkin, checkout, my_attendance

urlpatterns = [
    path("<int:workspace_id>/checkin/", checkin),
    path("<int:workspace_id>/checkout/", checkout),
    path("<int:workspace_id>/me/", my_attendance),
]
