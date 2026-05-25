# chat/services/file_service.py

import os
from django.core.exceptions import ValidationError

# ── MVP Configuration ────────────────────────────────────────────────────────

# Strict mapping of extensions to their EXACT expected MIME types
EXT_TO_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".zip": "application/zip",
}

# Industry Standard Tiered Limits for CHAT UPLOADS
MAX_SIZE_PER_TYPE_MB = {
    ".jpg": 20,
    ".jpeg": 20,
    ".png": 20,
    ".webp": 20,
    ".pdf": 10,
    ".txt": 5,
    ".zip": 25,
}

MAX_FILES_PER_REQUEST = 5
MAX_TOTAL_PAYLOAD_MB = 50

# ── Validation Functions ─────────────────────────────────────────────────────


def validate_upload_payload(files_list):
    """
    Validates the total payload of a request before processing individual files.
    Prevents DoS via massive multi-file uploads.
    """
    if len(files_list) > MAX_FILES_PER_REQUEST:
        raise ValidationError(
            f"Cannot upload more than {MAX_FILES_PER_REQUEST} files at once."
        )

    total_size = sum(f.size for f in files_list)
    if total_size > MAX_TOTAL_PAYLOAD_MB * 1024 * 1024:
        raise ValidationError(
            f"Total upload size cannot exceed {MAX_TOTAL_PAYLOAD_MB}MB."
        )


def validate_file_upload(file_obj):
    """
    Validates a single file's extension, tiered size limit, and STRICT MIME type.
    Returns the validated extension and MIME type if successful.
    """
    # 1. Validate File Extension
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in EXT_TO_MIME:
        raise ValidationError(
            f"File extension '{ext}' is not allowed. "
            f"Allowed types: jpg, png, webp, pdf, txt, zip."
        )

    # 2. Validate Individual File Size (Tiered)
    max_size_mb = MAX_SIZE_PER_TYPE_MB.get(ext, 10)
    if file_obj.size > max_size_mb * 1024 * 1024:
        raise ValidationError(
            f"File '{file_obj.name}' exceeds the {max_size_mb}MB size limit for {ext} files."
        )

    # 3. STRICT MIME Type Validation
    # The MIME type provided by the browser MUST match the expected MIME for the extension exactly.
    mime_type = file_obj.content_type
    expected_mime = EXT_TO_MIME[ext]  # We know ext exists from step 1

    if mime_type != expected_mime:
        # Allow slight browser variations for jpg/jpeg if needed, but otherwise strict
        is_jpg_variant = (ext in [".jpg", ".jpeg"]) and (mime_type == "image/jpeg")

        if not is_jpg_variant:
            raise ValidationError(
                f"Security Alert: MIME type '{mime_type}' does not match extension '{ext}'. "
                f"Expected '{expected_mime}'. File rejected."
            )

    return ext, mime_type
