# acumen_backend/config/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        customized_response = {"error": "Request failed", "details": response.data}

        # If it's a simple string error, extract it
        if isinstance(response.data, dict) and "detail" in response.data:
            customized_response["error"] = str(response.data["detail"])
            customized_response["details"] = {}

        response.data = customized_response

    return response
