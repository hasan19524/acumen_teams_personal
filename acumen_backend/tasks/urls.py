from django.urls import path
from . import views

urlpatterns = [
    path("", views.task_list),
    path("create/", views.task_create),
    path("<int:pk>/update/", views.task_update),
    path("<int:pk>/delete/", views.task_delete),
]
