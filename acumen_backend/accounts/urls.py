from django.urls import path
from .views import register, login_user, me, me_update

urlpatterns = [
    path("register/", register),
    path("login/", login_user),
    path("me/", me),
    path("me/update/", me_update),
]
