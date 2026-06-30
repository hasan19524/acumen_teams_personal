from django.urls import path
from . import views
from .views import (
    clock_status,
    clock_in,
    clock_out,
    register,
    login_user,
    me,
    me_update,
)

urlpatterns = [
    path("register/", register),
    path("login/", login_user),
    path("me/", me),
    path("me/update/", me_update),
    # Fix: Align paths with frontend calls
    path("clock-status/", clock_status, name="clock-status"),
    path("clock-in/", clock_in, name="clock-in"),
    path("clock-out/", clock_out, name="clock-out"),
    # Fix: Use views.clock_history since it's imported via `from . import views`
    path("clock-history/", views.clock_history, name="clock_history"),
]
