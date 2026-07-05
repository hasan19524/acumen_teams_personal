import os
import uuid
import boto3
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_presigned_url(request):
    file_name = request.data.get("file_name")
    file_type = request.data.get("file_type")

    if not file_name or not file_type:
        return Response({"error": "file_name and file_type required"}, status=400)

    # Generate a unique filename to prevent overwrites in S3
    ext = file_name.split(".")[-1]
    unique_key = f"uploads/{uuid.uuid4()}.{ext}"

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_S3_REGION_NAME", "us-east-1"),
    )

    try:
        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": os.getenv("AWS_STORAGE_BUCKET_NAME"),
                "Key": unique_key,
                "ContentType": file_type,
            },
            ExpiresIn=3600,  # URL valid for 1 hour
        )

        public_url = f"https://{os.getenv('AWS_STORAGE_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION_NAME', 'us-east-1')}.amazonaws.com/{unique_key}"

        return Response({"upload_url": upload_url, "public_url": public_url})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
