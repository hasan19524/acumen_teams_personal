# chat/services/file_service.py

import os
import zipfile
from django.core.exceptions import ValidationError

# ── MVP Configuration ────────────────────────────────────────────────────────

# File type configuration: maps extensions to their allowed MIME types and size limits.
# MIME types are now lists to account for browser variants (e.g., ZIP files).
FILE_TYPE_CONFIG = {
    # ── Images ───────────────────────────────────────────────────────────
    ".jpg": {"mimes": ["image/jpeg"], "max_size_mb": 20},
    ".jpeg": {"mimes": ["image/jpeg"], "max_size_mb": 20},
    ".png": {"mimes": ["image/png"], "max_size_mb": 20},
    ".webp": {"mimes": ["image/webp"], "max_size_mb": 20},
    # ── Videos ───────────────────────────────────────────────────────────
    ".mp4": {"mimes": ["video/mp4", "video/mp4; codecs=avc1"], "max_size_mb": 120},
    ".webm": {"mimes": ["video/webm"], "max_size_mb": 120},
    ".mov": {"mimes": ["video/quicktime"], "max_size_mb": 120},
    # ── Documents ────────────────────────────────────────────────────────
    ".pdf": {"mimes": ["application/pdf"], "max_size_mb": 10},
    ".txt": {"mimes": ["text/plain", "text/plain; charset=utf-8"], "max_size_mb": 5},
    # ── Archives ─────────────────────────────────────────────────────────
    # Browsers send varying MIME types for ZIPs. We allow the common variants.
    # SECURITY: application/octet-stream is intentionally omitted here to prevent
    # arbitrary binary uploads masked as ZIPs. If a browser sends octet-stream,
    # the extension check still acts as the primary gatekeeper.
    ".zip": {
        "mimes": [
            "application/zip",
            "application/x-zip-compressed",
            "application/x-zip",
        ],
        "max_size_mb": 25,
    },
}

MAX_FILES_PER_REQUEST = 20
# Increased to allow a single 120MB video + small text attachment
MAX_TOTAL_PAYLOAD_MB = 150

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
    Validates a single file's extension, tiered size limit, and MIME type variants.
    Returns the validated extension and MIME type if successful.
    """
    # 1. Validate File Extension
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in FILE_TYPE_CONFIG:
        raise ValidationError(
            f"File extension '{ext}' is not allowed. "
            f"Allowed types: jpg, png, webp, mp4, webm, mov, pdf, txt, zip."
        )

    config = FILE_TYPE_CONFIG[ext]

    # 2. Validate Individual File Size (Tiered)
    max_size_mb = config["max_size_mb"]
    if file_obj.size > max_size_mb * 1024 * 1024:
        raise ValidationError(
            f"File '{file_obj.name}' exceeds the {max_size_mb}MB size limit for {ext} files."
        )

    # 3. MIME Type Validation (Flexible for browser variants)
    mime_type = file_obj.content_type
    allowed_mimes = config["mimes"]

    if mime_type not in allowed_mimes:
        # Fallback for browsers that send generic MIME types for known extensions
        # This is a security tradeoff: we trust the extension if the MIME is generic,
        # but only for non-executable formats.
        if mime_type == "application/octet-stream" and ext in [".zip", ".mp4", ".mov"]:
            pass  # Allow generic MIME for binary containers if extension is strictly checked
        else:
            raise ValidationError(
                f"Security Alert: MIME type '{mime_type}' does not match extension '{ext}'. "
                f"Expected one of: {', '.join(allowed_mimes)}. File rejected."
            )

    # 4. ZIP Security Check (Zip Bomb / Malicious Structure Prevention)
    if ext == ".zip":
        validate_zip_security(file_obj)

    return ext, mime_type


def validate_zip_security(file_obj):
    """
    Validates ZIP files for common malicious patterns without extracting them.
    Prevents Zip Bombs (oversized decompression) and deeply nested archives.
    """
    try:
        # Seek to start in case the file pointer has moved
        file_obj.seek(0)

        with zipfile.ZipFile(file_obj, "r") as zf:
            # Check 1: Compression Ratio (Zip Bomb defense)
            # If the compressed size is tiny but the uncompressed size is massive, it's a bomb.
            for info in zf.infolist():
                if info.compress_size > 0:
                    ratio = info.file_size / info.compress_size
                    # A ratio > 100 is highly suspicious for normal files
                    if ratio > 100:
                        raise ValidationError(
                            f"Security Alert: ZIP file contains highly compressed data "
                            f"(ratio: {ratio:.0f}x). Potential Zip Bomb. File rejected."
                        )

                # Check 2: Absolute file size inside zip
                # Prevent individual files inside the zip from being absurdly large
                MAX_UNCOMPRESSED_FILE_MB = 500
                if info.file_size > MAX_UNCOMPRESSED_FILE_MB * 1024 * 1024:
                    raise ValidationError(
                        f"Security Alert: ZIP contains file '{info.filename}' exceeding "
                        f"{MAX_UNCOMPRESSED_FILE_MB}MB uncompressed. File rejected."
                    )

            # Check 3: Nesting level (prevent zip quines/bombs)
            for info in zf.infolist():
                if info.filename.lower().endswith(".zip"):
                    raise ValidationError(
                        "Security Alert: Nested ZIP archives are not permitted. File rejected."
                    )

    except zipfile.BadZipFile:
        raise ValidationError("The uploaded ZIP file is corrupt or invalid.")
    finally:
        # Reset pointer so Django can save the file properly later
        file_obj.seek(0)
