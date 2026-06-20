# acumen_backend/tasks/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("<int:workspace_id>/", views.task_list, name="task-list"),
    path("<int:workspace_id>/<int:pk>/", views.task_detail, name="task-detail"),
    path("<int:workspace_id>/create/", views.task_create, name="task-create"),
    path("<int:workspace_id>/<int:pk>/update/", views.task_update, name="task-update"),
    path(
        "<int:workspace_id>/<int:pk>/archive/", views.task_archive, name="task-archive"
    ),
    path(
        "<int:workspace_id>/workspace-members/",
        views.workspace_members,
        name="workspace-members",
    ),
    path(
        "<int:workspace_id>/team-members/<int:team_id>/",
        views.team_members,
        name="team-members",
    ),
    path(
        "<int:workspace_id>/task-member/<int:pk>/update-status/",
        views.task_member_update_status,
        name="task-member-update-status",
    ),
    path(
        "<int:workspace_id>/<int:task_id>/comments/",
        views.task_comments_list_create,
        name="task-comments",
    ),
    path(
        "<int:workspace_id>/comments/<int:pk>/",
        views.task_comment_update_delete,
        name="task-comment-detail",
    ),
    path(
        "<int:workspace_id>/<int:task_id>/attachments/",
        views.task_attachments_list_create,
        name="task-attachments",
    ),
    path(
        "<int:workspace_id>/attachments/<int:pk>/",
        views.task_attachment_delete,
        name="task-attachment-detail",
    ),
    path(
        "<int:workspace_id>/<int:pk>/approve/", views.task_approve, name="task-approve"
    ),
    path("<int:workspace_id>/<int:pk>/reject/", views.task_reject, name="task-reject"),
    path("<int:workspace_id>/analytics/", views.task_analytics, name="task-analytics"),
]
