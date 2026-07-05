from django.urls import path
from .views import get_presigned_url

urlpatterns = [
    path("presign/", get_presigned_url, name="presign"),
]
