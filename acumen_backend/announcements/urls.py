from django.urls import path
from . import views

urlpatterns = [
    path("<int:workspace_id>/", views.announcement_list),
    path("<int:workspace_id>/create/", views.announcement_create),
    path("<int:workspace_id>/<int:pk>/update/", views.announcement_update),
    path("<int:workspace_id>/<int:pk>/pin/", views.announcement_toggle_pin),
    path("<int:workspace_id>/<int:pk>/archive/", views.announcement_toggle_archive),
    path("<int:workspace_id>/<int:pk>/delete/", views.announcement_delete),
    path("<int:workspace_id>/<int:pk>/mark-read/", views.announcement_mark_read),
    path(
        "<int:workspace_id>/<int:pk>/attachments/",
        views.announcement_upload_attachments,
        name="announcement-upload-attachments",
    ),  # NEW LINE
    path(
        "<int:workspace_id>/<int:pk>/",
        views.announcement_detail,
        name="announcement-detail",
    ),
]
