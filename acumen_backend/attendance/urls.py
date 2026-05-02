from django.urls import path
from .views import checkin, checkout, my_attendance

urlpatterns = [
    path("checkin/", checkin),
    path("checkout/", checkout),
    path("me/", my_attendance),
]