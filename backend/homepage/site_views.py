"""Staff and public APIs for the admin site console."""

from __future__ import annotations

import logging

from cloudinary import uploader as cloudinary_uploader
from cloudinary.exceptions import Error as CloudinaryError
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from PIL import Image, UnidentifiedImageError
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from vlog.permissions import IsStaffUser

from .models import SiteContent, SiteContentRevision
from .site_content import KEYS, SCHEMA_VERSION, SiteValidationError, default_documents, validate_document

logger = logging.getLogger(__name__)

MAX_REVISIONS = 20
HERO_MIN = (1600, 900)
SECTION_MIN = (800, 450)
MAX_UPLOAD_MB = 8


def ensure_documents() -> None:
    defaults = default_documents()
    now = timezone.now()
    for key in KEYS:
        SiteContent.objects.get_or_create(
            key=key,
            defaults={
                "draft": defaults[key],
                "published": defaults[key],
                "schema_version": SCHEMA_VERSION,
                "published_at": now,
            },
        )


def _stamp(value) -> str | None:
    return value.isoformat() if value else None


def _payload(row: SiteContent) -> dict:
    return {
        "key": row.key,
        "draft": row.draft,
        "published": row.published,
        "schema_version": row.schema_version,
        "updated_at": _stamp(row.updated_at),
        "published_at": _stamp(row.published_at),
        "dirty": row.draft != row.published,
    }


def _expected_matches(row: SiteContent, raw) -> bool:
    if not raw or not isinstance(raw, str):
        return False
    expected = parse_datetime(raw)
    if expected is None or row.updated_at is None:
        return False
    if timezone.is_naive(expected):
        expected = timezone.make_aware(expected, timezone.get_current_timezone())
    return abs((row.updated_at - expected).total_seconds()) < 1


def _conflict(row: SiteContent) -> Response:
    return Response(
        {
            "detail": "Someone else saved a newer draft. Reload to see their changes.",
            "updated_at": _stamp(row.updated_at),
        },
        status=status.HTTP_409_CONFLICT,
    )


def _invalid(exc: SiteValidationError) -> Response:
    return Response(
        {"detail": "Fix the highlighted fields before saving.", "fields": exc.fields},
        status=status.HTTP_400_BAD_REQUEST,
    )


class PublicSiteContentView(APIView):
    """Published document only. Anonymous, so a stale cookie cannot block the homepage."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, key: str):
        if key not in KEYS:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ensure_documents()
        row = get_object_or_404(SiteContent, key=key)
        return Response({"key": row.key, "document": row.published, "published_at": _stamp(row.published_at)})


class StudioSiteContentView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request, key: str):
        if key not in KEYS:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ensure_documents()
        return Response(_payload(get_object_or_404(SiteContent, key=key)))

    def put(self, request, key: str):
        if key not in KEYS:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ensure_documents()
        row = get_object_or_404(SiteContent, key=key)
        if not _expected_matches(row, request.data.get("expected_updated_at")):
            return _conflict(row)
        try:
            cleaned = validate_document(key, request.data.get("draft"))
        except SiteValidationError as exc:
            return _invalid(exc)
        row.draft = cleaned
        row.schema_version = SCHEMA_VERSION
        row.updated_by = request.user
        row.save(update_fields=["draft", "schema_version", "updated_by", "updated_at"])
        row.refresh_from_db()
        return Response(_payload(row))


class StudioSitePublishView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, key: str):
        if key not in KEYS:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ensure_documents()
        row = get_object_or_404(SiteContent, key=key)
        if not _expected_matches(row, request.data.get("expected_updated_at")):
            return _conflict(row)
        try:
            cleaned = validate_document(key, row.draft)
        except SiteValidationError as exc:
            return _invalid(exc)
        with transaction.atomic():
            SiteContentRevision.objects.create(
                content=row,
                snapshot=row.published,
                created_by=request.user,
            )
            stale = list(
                SiteContentRevision.objects.filter(content=row).order_by("-created_at").values_list("id", flat=True)[MAX_REVISIONS:]
            )
            if stale:
                SiteContentRevision.objects.filter(id__in=stale).delete()
            row.draft = cleaned
            row.published = cleaned
            row.published_at = timezone.now()
            row.updated_by = request.user
            row.schema_version = SCHEMA_VERSION
            row.save(update_fields=["draft", "published", "published_at", "updated_by", "schema_version", "updated_at"])
        row.refresh_from_db()
        return Response(_payload(row))


class StudioSiteDiscardView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, key: str):
        if key not in KEYS:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ensure_documents()
        row = get_object_or_404(SiteContent, key=key)
        if not _expected_matches(row, request.data.get("expected_updated_at")):
            return _conflict(row)
        row.draft = row.published
        row.updated_by = request.user
        row.save(update_fields=["draft", "updated_by", "updated_at"])
        row.refresh_from_db()
        return Response(_payload(row))


class StudioSiteRevisionListView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request, key: str):
        if key not in KEYS:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ensure_documents()
        row = get_object_or_404(SiteContent, key=key)
        revisions = row.revisions.select_related("created_by")[:MAX_REVISIONS]
        return Response({
            "results": [
                {
                    "id": revision.id,
                    "created_at": _stamp(revision.created_at),
                    "created_by": getattr(revision.created_by, "email", "") or "",
                }
                for revision in revisions
            ]
        })


class StudioSiteRestoreView(APIView):
    """Copy a published snapshot back into the draft. It does not go live until publish."""

    permission_classes = [IsStaffUser]

    def post(self, request, key: str):
        if key not in KEYS:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ensure_documents()
        row = get_object_or_404(SiteContent, key=key)
        if not _expected_matches(row, request.data.get("expected_updated_at")):
            return _conflict(row)
        revision = get_object_or_404(SiteContentRevision, content=row, pk=request.data.get("revision_id"))
        try:
            cleaned = validate_document(key, revision.snapshot)
        except SiteValidationError as exc:
            return _invalid(exc)
        row.draft = cleaned
        row.updated_by = request.user
        row.save(update_fields=["draft", "updated_by", "updated_at"])
        row.refresh_from_db()
        return Response(_payload(row))


class StudioSiteMediaView(APIView):
    """Image upload for hero and section photos. Dimensions are checked before storage."""

    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "Choose an image to upload."}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > MAX_UPLOAD_MB * 1024 * 1024:
            return Response(
                {"detail": f"Images must be {MAX_UPLOAD_MB} MB or smaller."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        role = (request.query_params.get("role") or request.data.get("role") or "section").strip()
        minimum = HERO_MIN if role == "hero" else SECTION_MIN
        try:
            with Image.open(upload) as image:
                width, height = image.size
                image.verify()
        except (UnidentifiedImageError, OSError):
            return Response({"detail": "Upload a JPEG, PNG, or WebP image."}, status=status.HTTP_400_BAD_REQUEST)
        if width < minimum[0] or height < minimum[1]:
            return Response(
                {"detail": f"Use an image at least {minimum[0]}×{minimum[1]} pixels so it stays sharp."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        upload.seek(0)
        if not getattr(settings, "PRECON_ASSET_STORAGE_CONFIGURED", False):
            return Response(
                {"detail": "File storage is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            uploaded = cloudinary_uploader.upload(
                upload,
                resource_type="image",
                folder="site/studio",
                use_filename=True,
                unique_filename=True,
            )
        except CloudinaryError:
            logger.exception("Site image upload failed")
            return Response(
                {"detail": "The image could not be stored. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        url = str(uploaded.get("secure_url") or "")
        if not url.startswith("https://"):
            return Response({"detail": "Storage returned an unusable link."}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(
            {"url": url, "width": width, "height": height},
            status=status.HTTP_201_CREATED,
        )
