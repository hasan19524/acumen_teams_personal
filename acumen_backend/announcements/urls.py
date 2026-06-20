# acumen_backend/announcements/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("<int:workspace_id>/", views.announcement_list),
    path("<int:workspace_id>/create/", views.announcement_create),
    path("<int:workspace_id>/<int:pk>/delete/", views.announcement_delete),
    path("<int:workspace_id>/<int:pk>/mark-read/", views.announcement_mark_read),
]
