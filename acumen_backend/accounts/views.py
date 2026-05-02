from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer


@api_view(['POST'])
def register(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User created"})

    return Response(serializer.errors, status=400)


@api_view(['POST'])
def login_user(request):
    login_value = request.data.get("login")
    password = request.data.get("password")

    user_obj = None

    # Try email login
    if "@" in login_value:
        try:
            user_obj = User.objects.get(email=login_value)
            username = user_obj.username
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=401)
    else:
        username = login_value

    user = authenticate(username=username, password=password)

    if user is not None:
        refresh = RefreshToken.for_user(user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })

    return Response({"error": "Invalid credentials"}, status=401)