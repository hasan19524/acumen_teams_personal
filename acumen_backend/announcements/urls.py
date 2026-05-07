from django.urls import path
from . import views

urlpatterns = [
    path("", views.announcement_list),
    path("create/", views.announcement_create),
    path("<int:pk>/delete/", views.announcement_delete),
]