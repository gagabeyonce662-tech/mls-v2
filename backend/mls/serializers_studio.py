"""Serializers for the staff Studio (scope #2d): pre-con projects and submission review."""
import re

from rest_framework import serializers

from mls.models import Content, ListingSubmission, ListingSubmissionMedia, PreComProperty
from mls.serializers_precon import _featured_image_url

# Content statuses a Studio editor can choose. "active" is legacy-only.
PRECON_EDITABLE_STATUSES = [Content.DRAFT, Content.PUBLISH, Content.PRIVATE, Content.ARCHIVED]
META_KEY_RE = re.compile(r"^[a-z0-9_]{1,100}$")
MAX_ATTACHMENTS = 60


# --------------------------------------------------------------------------
# Pre-con projects
# --------------------------------------------------------------------------


class StudioPreconListSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="content.title", read_only=True)
    slug = serializers.CharField(source="content.slug", read_only=True)
    status = serializers.CharField(source="content.status", read_only=True)
    published_at = serializers.DateTimeField(source="content.published_at", read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    assignment_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = PreComProperty
        fields = [
            "id", "title", "slug", "status", "published_at", "address", "price",
            "developer_name", "sales_stage", "is_featured", "featured_order",
            "featured_image_url", "assignment_count",
        ]

    def get_featured_image_url(self, obj):
        return _featured_image_url(obj)


class StudioPreconDetailSerializer(StudioPreconListSerializer):
    """Everything the editor shows, including gated document links."""

    wp_id = serializers.IntegerField(source="content.wp_id", read_only=True)
    body = serializers.CharField(source="content.content", read_only=True)
    excerpt = serializers.CharField(source="content.excerpt", read_only=True)
    attachments = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()

    class Meta(StudioPreconListSerializer.Meta):
        fields = StudioPreconListSerializer.Meta.fields + [
            "wp_id", "body", "excerpt", "bedrooms", "bathrooms", "garages", "area",
            "lot_size", "latitude", "longitude", "updated_at", "attachments", "meta",
        ]

    def get_attachments(self, obj):
        return [
            {"id": a.id, "url": a.url, "mime_type": a.mime_type, "title": a.title}
            for a in sorted(obj.content.attachments.all(), key=lambda a: a.id)
        ]

    def get_meta(self, obj):
        return {m.key: m.value for m in obj.content.meta.all()}


class AttachmentInputSerializer(serializers.Serializer):
    # Attachment.url is a default URLField (200 chars).
    url = serializers.URLField(max_length=200)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    mime_type = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")


class StudioPreconWriteSerializer(serializers.Serializer):
    """Create/update input. Every field is optional on PATCH (``partial=True``)."""

    title = serializers.CharField(max_length=500)
    slug = serializers.SlugField(max_length=500, required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=PRECON_EDITABLE_STATUSES, required=False)
    body = serializers.CharField(required=False, allow_blank=True)
    excerpt = serializers.CharField(required=False, allow_blank=True)

    price = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True, min_value=0)
    bedrooms = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=50)
    bathrooms = serializers.DecimalField(max_digits=4, decimal_places=1, required=False, allow_null=True, min_value=0)
    garages = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=50)
    area = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True, min_value=0)
    lot_size = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True, min_value=0)
    latitude = serializers.DecimalField(
        max_digits=10, decimal_places=7, required=False, allow_null=True, min_value=-90, max_value=90
    )
    longitude = serializers.DecimalField(
        max_digits=10, decimal_places=7, required=False, allow_null=True, min_value=-180, max_value=180
    )
    address = serializers.CharField(required=False, allow_blank=True)
    developer_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    sales_stage = serializers.ChoiceField(
        choices=[c for c, _ in PreComProperty.SALES_STAGE_CHOICES], required=False, allow_blank=True
    )
    is_featured = serializers.BooleanField(required=False)
    featured_order = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=1000)

    # Full replacement, in display order: the first image is the cover.
    attachments = AttachmentInputSerializer(many=True, required=False, max_length=MAX_ATTACHMENTS)
    # Partial: keys sent with "" or null are removed, keys not sent are kept.
    meta = serializers.DictField(
        child=serializers.CharField(allow_blank=True, allow_null=True, trim_whitespace=True),
        required=False,
    )

    def validate_meta(self, value):
        bad = [key for key in value if not META_KEY_RE.match(key)]
        if bad:
            raise serializers.ValidationError(
                f"Detail keys use lowercase letters, digits and underscores: {', '.join(bad[:5])}"
            )
        return value


# --------------------------------------------------------------------------
# Submission review
# --------------------------------------------------------------------------


def _media_url(item):
    try:
        return item.file.url
    except (ValueError, AttributeError):
        return ""


class StudioSubmissionListSerializer(serializers.ModelSerializer):
    purpose_label = serializers.CharField(source="get_purpose_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    submitter_type_label = serializers.CharField(source="get_submitter_type_display", read_only=True)
    cover_url = serializers.SerializerMethodField()
    photo_count = serializers.SerializerMethodField()
    precon_title = serializers.SerializerMethodField()

    class Meta:
        model = ListingSubmission
        fields = [
            "id", "purpose", "purpose_label", "status", "status_label", "submitter_type",
            "submitter_type_label", "address_line_1", "city", "project_name", "builder_name",
            "asking_price", "assignment_fee", "contact_name", "contact_email",
            "submitted_at", "reviewed_at", "precon_property", "precon_title",
            "cover_url", "photo_count",
        ]

    def _photos(self, obj):
        return [m for m in obj.media.all() if m.media_type == ListingSubmissionMedia.MediaType.PHOTO]

    def get_cover_url(self, obj):
        photos = self._photos(obj)
        return _media_url(photos[0]) if photos else None

    def get_photo_count(self, obj):
        return len(self._photos(obj))

    def get_precon_title(self, obj):
        precon = obj.precon_property
        return precon.content.title if precon and precon.content_id else None


class StudioSubmissionDetailSerializer(StudioSubmissionListSerializer):
    """The full private record: contact details, pricing and every document."""

    media = serializers.SerializerMethodField()
    submitted_by_email = serializers.EmailField(source="submitted_by.email", read_only=True)
    reviewed_by_email = serializers.SerializerMethodField()

    class Meta(StudioSubmissionListSerializer.Meta):
        fields = StudioSubmissionListSerializer.Meta.fields + [
            "address_line_2", "province", "postal_code", "country", "property_type",
            "bedrooms", "bathrooms", "interior_area_sqft", "available_from", "description",
            "occupancy_date", "original_purchase_price", "deposit_paid", "contact_phone",
            "ownership_confirmed", "publication_consent", "review_note", "submitted_ip",
            "submitted_user_agent", "created_at", "updated_at", "media",
            "submitted_by_email", "reviewed_by_email",
        ]

    def get_media(self, obj):
        return [
            {
                "id": m.id,
                "media_type": m.media_type,
                "media_type_label": m.get_media_type_display(),
                "url": _media_url(m),
                "name": (m.file.name or "").rsplit("/", 1)[-1],
            }
            for m in obj.media.all()
        ]

    def get_reviewed_by_email(self, obj):
        return obj.reviewed_by.email if obj.reviewed_by_id else None


class SubmissionDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            ListingSubmission.Status.UNDER_REVIEW,
            ListingSubmission.Status.NEEDS_CHANGES,
            ListingSubmission.Status.APPROVED,
            ListingSubmission.Status.REJECTED,
        ]
    )
    review_note = serializers.CharField(required=False, allow_blank=True, max_length=4000, default="")
    # Omit to keep the current link; null clears it.
    precon_property = serializers.PrimaryKeyRelatedField(
        queryset=PreComProperty.objects.all(), required=False, allow_null=True
    )
    notify = serializers.BooleanField(required=False, default=True)
