"""Staff Studio endpoints (scope #2d): pre-con projects and listing submission review.

Everything here is staff-only (``is_staff``), a stricter bar than the blog's
``can_author``: these edit public project pages and decide what gets published.
The frontend's ``/api/studio/*`` proxy checks staff independently.
"""
import logging
import mimetypes
from urllib.parse import urlparse

from cloudinary import uploader as cloudinary_uploader
from cloudinary.exceptions import Error as CloudinaryError
from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Count, F, Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from mls.models import Attachment, Content, ContentMeta, ListingSubmission, PreComProperty
from mls.serializers_studio import (
    StudioPreconDetailSerializer,
    StudioPreconListSerializer,
    StudioPreconWriteSerializer,
    StudioSubmissionDetailSerializer,
    StudioSubmissionListSerializer,
    SubmissionDecisionSerializer,
)
from mls.services.submission_notifications import send_submission_decision_email
from vlog.permissions import IsStaffUser

logger = logging.getLogger(__name__)

# Studio-created projects take wp_ids from here up, clear of WordPress imports.
STUDIO_WP_ID_FLOOR = 10_000_000

PRECON_CONTENT_FIELDS = {"title": "title", "slug": "slug", "status": "status", "body": "content", "excerpt": "excerpt"}
PRECON_PROPERTY_FIELDS = (
    "price", "bedrooms", "bathrooms", "garages", "area", "lot_size", "latitude", "longitude",
    "address", "developer_name", "sales_stage", "is_featured", "featured_order",
)


class StudioPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


def _infer_mime_type(url: str) -> str:
    guessed, _ = mimetypes.guess_type(urlparse(url or "").path)
    return guessed or "application/octet-stream"


def _next_wp_id() -> int:
    current = Content.objects.aggregate(top=Max("wp_id"))["top"] or 0
    return max(current, STUDIO_WP_ID_FLOOR) + 1


def _precon_queryset():
    return PreComProperty.objects.select_related("content").prefetch_related(
        "content__attachments", "content__meta"
    )


@transaction.atomic
def save_precon(instance: PreComProperty | None, data: dict) -> PreComProperty:
    """Create or update a project with its Content, attachments and meta."""
    if instance is None:
        title = data["title"].strip()
        content = Content(
            wp_id=_next_wp_id(),
            content_type=Content.PROPERTY,
            title=title,
            slug=data.get("slug") or slugify(title)[:500] or "project",
            status=data.get("status") or Content.DRAFT,
            content=data.get("body", ""),
            excerpt=data.get("excerpt", ""),
        )
        # The public list sorts by published_at; stamp the first publication.
        if content.status == Content.PUBLISH and content.published_at is None:
            content.published_at = timezone.now()
        content.save()
        # ``create_precom_property_for_content`` may already have inserted the
        # row on Content post_save — reuse it so the OneToOne does not collide.
        instance, _ = PreComProperty.objects.get_or_create(content=content)
    else:
        content = instance.content
        for key, field in PRECON_CONTENT_FIELDS.items():
            if key in data:
                setattr(content, field, data[key])
        if "slug" in data and not data["slug"]:
            content.slug = slugify(content.title)[:500] or "project"
        if content.status == Content.PUBLISH and content.published_at is None:
            content.published_at = timezone.now()
        content.save()

    for field in PRECON_PROPERTY_FIELDS:
        if field in data:
            value = data[field]
            setattr(instance, field, "" if value is None and field in ("address", "developer_name", "sales_stage") else value)
    if not instance.is_featured:
        instance.featured_order = None
    instance.save()

    if "attachments" in data:
        content.attachments.all().delete()
        Attachment.objects.bulk_create(
            [
                Attachment(
                    content=content,
                    url=item["url"],
                    title=item.get("title", "")[:255],
                    mime_type=(item.get("mime_type") or _infer_mime_type(item["url"]))[:100],
                )
                for item in data["attachments"]
            ]
        )

    for key, value in (data.get("meta") or {}).items():
        if value is None or str(value).strip() == "":
            ContentMeta.objects.filter(content=content, key=key).delete()
        else:
            ContentMeta.objects.update_or_create(content=content, key=key, defaults={"value": str(value)})

    return instance


class StudioPreconListCreateAPIView(APIView):
    """GET: every project, any status (``?q=``, ``?status=``, ``?page=``). POST: create one."""

    permission_classes = [IsStaffUser]

    def get(self, request):
        params = request.query_params
        qs = (
            PreComProperty.objects.select_related("content")
            .prefetch_related("content__attachments")
            .annotate(assignment_count=Count("assignment_submissions", distinct=True))
            .order_by(F("content__published_at").desc(nulls_first=True), "-id")
        )
        query = (params.get("q") or "").strip()[:120]
        if query:
            filters = Q(content__title__icontains=query) | Q(address__icontains=query) | Q(
                developer_name__icontains=query
            )
            if query.isdigit():
                filters |= Q(pk=int(query))
            qs = qs.filter(filters)
        wanted = (params.get("status") or "").strip()
        if wanted:
            qs = qs.filter(content__status=wanted)
        if params.get("featured") == "1":
            qs = qs.filter(is_featured=True).order_by(F("featured_order").asc(nulls_last=True), "-id")

        paginator = StudioPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response(StudioPreconListSerializer(page, many=True).data)

    def post(self, request):
        serializer = StudioPreconWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            instance = save_precon(None, serializer.validated_data)
        except IntegrityError:
            # Two creates raced for the same wp_id; one retry picks the next free one.
            try:
                instance = save_precon(None, serializer.validated_data)
            except IntegrityError:
                logger.exception("Studio pre-con create hit a uniqueness conflict twice")
                return Response(
                    {"detail": "Could not create that project. Try a different name or slug."},
                    status=status.HTTP_409_CONFLICT,
                )
        instance = _precon_queryset().get(pk=instance.pk)
        return Response(StudioPreconDetailSerializer(instance).data, status=status.HTTP_201_CREATED)


class StudioPreconDetailAPIView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request, pk):
        instance = get_object_or_404(_precon_queryset(), pk=pk)
        return Response(StudioPreconDetailSerializer(instance).data)

    def patch(self, request, pk):
        instance = get_object_or_404(_precon_queryset(), pk=pk)
        serializer = StudioPreconWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        save_precon(instance, serializer.validated_data)
        instance = _precon_queryset().get(pk=pk)
        return Response(StudioPreconDetailSerializer(instance).data)

    def delete(self, request, pk):
        instance = get_object_or_404(PreComProperty.objects.select_related("content"), pk=pk)
        # Deleting would cascade away lead records; archiving keeps them.
        leads = instance.floor_plan_intents.count()
        if leads:
            return Response(
                {
                    "detail": f"This project has {leads} floor plan request(s) from buyers. "
                    "Archive it instead so those leads are kept."
                },
                status=status.HTTP_409_CONFLICT,
            )
        instance.content.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioPreconAssetUploadAPIView(APIView):
    """POST a photo or PDF (``file``); stores it in Cloudinary and returns its URL."""

    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "Choose a file to upload."}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.PRECON_ASSET_STORAGE_CONFIGURED:
            return Response(
                {"detail": "File storage is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        max_mb = settings.PRECON_ASSET_MAX_UPLOAD_MB
        if upload.size > max_mb * 1024 * 1024:
            return Response({"detail": f"Files must be {max_mb} MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)

        supplied = str(getattr(upload, "content_type", "") or "").lower()
        mime_type = supplied if supplied.startswith("image/") or supplied == "application/pdf" else _infer_mime_type(upload.name)
        if not (mime_type.startswith("image/") or mime_type == "application/pdf"):
            return Response(
                {"detail": "Upload a JPEG, PNG, WebP, GIF or PDF file."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            uploaded = cloudinary_uploader.upload(
                upload,
                resource_type="auto",
                folder="precon/studio",
                use_filename=True,
                unique_filename=True,
            )
        except CloudinaryError:
            logger.exception("Studio pre-con upload failed")
            return Response(
                {"detail": "The file could not be stored. Please try again."}, status=status.HTTP_502_BAD_GATEWAY
            )
        url = str(uploaded.get("secure_url") or "")
        if not url or len(url) > 200:
            return Response({"detail": "Storage returned an unusable link."}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(
            {"url": url, "mime_type": mime_type, "title": upload.name[:255]}, status=status.HTTP_201_CREATED
        )


# --------------------------------------------------------------------------
# Submission review
# --------------------------------------------------------------------------

Status = ListingSubmission.Status

# Review queue tabs. Drafts and withdrawals are the owner's, never listed.
QUEUE_FILTERS = {
    "open": [Status.SUBMITTED, Status.UNDER_REVIEW],
    "needs_changes": [Status.NEEDS_CHANGES],
    "approved": [Status.APPROVED],
    "rejected": [Status.REJECTED],
    "all": [Status.SUBMITTED, Status.UNDER_REVIEW, Status.NEEDS_CHANGES, Status.APPROVED, Status.REJECTED],
}

# Which decisions a reviewer may make from each status.
ALLOWED_DECISIONS = {
    Status.SUBMITTED: {Status.UNDER_REVIEW, Status.NEEDS_CHANGES, Status.APPROVED, Status.REJECTED},
    Status.UNDER_REVIEW: {Status.NEEDS_CHANGES, Status.APPROVED, Status.REJECTED},
    Status.NEEDS_CHANGES: {Status.APPROVED, Status.REJECTED},
    # Unpublishing an approved listing, or sending it back for edits.
    Status.APPROVED: {Status.NEEDS_CHANGES, Status.REJECTED},
    Status.REJECTED: {Status.UNDER_REVIEW},
}
NOTE_REQUIRED = {Status.NEEDS_CHANGES, Status.REJECTED}


def _submission_queryset():
    return ListingSubmission.objects.select_related(
        "precon_property__content", "submitted_by", "reviewed_by"
    ).prefetch_related("media")


class StudioSubmissionListAPIView(APIView):
    """Review queue. ``?queue=open|needs_changes|approved|rejected|all``, ``?purpose=``, ``?q=``."""

    permission_classes = [IsStaffUser]

    def get(self, request):
        params = request.query_params
        queue = params.get("queue") if params.get("queue") in QUEUE_FILTERS else "open"
        base = ListingSubmission.objects.all()
        purpose = (params.get("purpose") or "").strip()
        if purpose in ListingSubmission.Purpose.values:
            base = base.filter(purpose=purpose)
        query = (params.get("q") or "").strip()[:120]
        if query:
            filters = (
                Q(address_line_1__icontains=query)
                | Q(city__icontains=query)
                | Q(project_name__icontains=query)
                | Q(contact_name__icontains=query)
                | Q(contact_email__icontains=query)
            )
            if query.isdigit():
                filters |= Q(pk=int(query))
            base = base.filter(filters)

        counts = {
            key: base.filter(status__in=statuses).count() for key, statuses in QUEUE_FILTERS.items()
        }
        qs = (
            _submission_queryset()
            .filter(pk__in=base.filter(status__in=QUEUE_FILTERS[queue]).values("pk"))
            # Oldest first for open work (first in, first reviewed); newest first otherwise.
            .order_by(
                F("submitted_at").asc(nulls_last=True) if queue == "open" else F("submitted_at").desc(nulls_last=True),
                "id",
            )
        )
        paginator = StudioPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        response = paginator.get_paginated_response(StudioSubmissionListSerializer(page, many=True).data)
        response.data["counts"] = counts
        response.data["queue"] = queue
        return response


class StudioSubmissionDetailAPIView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request, pk):
        submission = get_object_or_404(_submission_queryset().exclude(status=Status.DRAFT), pk=pk)
        data = StudioSubmissionDetailSerializer(submission).data
        data["allowed_decisions"] = sorted(ALLOWED_DECISIONS.get(submission.status, ()))
        return Response(data)


class StudioSubmissionDecisionAPIView(APIView):
    """POST {status, review_note, precon_property?, notify?}: record a review decision."""

    permission_classes = [IsStaffUser]

    def post(self, request, pk):
        submission = get_object_or_404(_submission_queryset(), pk=pk)
        serializer = SubmissionDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        decision = data["status"]

        if decision not in ALLOWED_DECISIONS.get(submission.status, set()):
            return Response(
                {"detail": f"A {Status(submission.status).label.lower()} submission can't be moved to that status."},
                status=status.HTTP_409_CONFLICT,
            )
        note = data.get("review_note", "").strip()
        if decision in NOTE_REQUIRED and not note:
            return Response(
                {"review_note": ["Tell the submitter what to change or why it was declined."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission.status = decision
        submission.review_note = note
        submission.reviewed_by = request.user
        # reviewed_at doubles as the public "published" date, so approval stamps it last.
        submission.reviewed_at = timezone.now()
        fields = ["status", "review_note", "reviewed_by", "reviewed_at", "updated_at"]
        if "precon_property" in data:
            submission.precon_property = data["precon_property"]
            fields.append("precon_property")
        submission.save(update_fields=fields)

        emailed = send_submission_decision_email(submission) if data.get("notify", True) else False
        submission = _submission_queryset().get(pk=pk)
        payload = StudioSubmissionDetailSerializer(submission).data
        payload["allowed_decisions"] = sorted(ALLOWED_DECISIONS.get(submission.status, ()))
        payload["emailed"] = emailed
        return Response(payload)


class StudioSubmissionLinkAPIView(APIView):
    """PATCH {precon_property: id | null}: link an assignment to a project without a decision."""

    permission_classes = [IsStaffUser]

    def patch(self, request, pk):
        submission = get_object_or_404(_submission_queryset().exclude(status=Status.DRAFT), pk=pk)
        raw = request.data.get("precon_property")
        if raw in (None, ""):
            submission.precon_property = None
        else:
            try:
                submission.precon_property = PreComProperty.objects.get(pk=int(raw))
            except (TypeError, ValueError, PreComProperty.DoesNotExist):
                return Response({"precon_property": ["Project not found."]}, status=status.HTTP_400_BAD_REQUEST)
        submission.save(update_fields=["precon_property", "updated_at"])
        submission = _submission_queryset().get(pk=pk)
        payload = StudioSubmissionDetailSerializer(submission).data
        payload["allowed_decisions"] = sorted(ALLOWED_DECISIONS.get(submission.status, ()))
        return Response(payload)
