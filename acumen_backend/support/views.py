import os
import resend
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


@api_view(["POST"])
@permission_classes([AllowAny])
def contact_support(request):
    name = request.data.get("name", "").strip()
    email = request.data.get("email", "").strip()
    subject = request.data.get("subject", "").strip()
    message = request.data.get("message", "").strip()

    if not all([name, email, subject, message]):
        return Response(
            {"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {"error": "Invalid email address."}, status=status.HTTP_400_BAD_REQUEST
        )

    api_key = os.environ.get("RESEND_API_KEY")
    support_email = os.environ.get("SUPPORT_EMAIL", "hasansiddique19524@gmail.com")
    from_email = os.environ.get("FROM_EMAIL", "no-reply@acumenteams.com")

    if not api_key:
        return Response(
            {"error": "Email service not configured."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    resend.api_key = api_key

    email_subject = f"[Acumen Teams Support] {subject}"
    email_body = f"New Support Request\n\nName:\n{name}\n\nEmail:\n{email}\n\nSubject:\n{subject}\n\nMessage:\n{message}"

    try:
        resend.Emails.send(
            {
                "from": from_email,
                "to": [support_email],
                "subject": email_subject,
                "text": email_body,
            }
        )
        return Response(
            {
                "message": "Your message has been sent successfully. We'll get back to you as soon as possible."
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"error": "Failed to send email. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
