from rest_framework import serializers

from mls.models import (
    Attachment,
    Author,
    Content,
    ContentMeta,
    PreComProperty,
    Taxonomy,
)


# Gated pre-con documents. Each type is resolved from its meta URL key first
# (the WP importer and admin write these), then from an attachment whose title
# contains the keyword. The detail payload only ever exposes `has_*` flags; the
# URL itself is released through `document-intent/` to a phone-verified user.
PRECON_DOCUMENT_TYPES = {
    "floor_plan": ("floor_plan_url", "floor"),
    "price_list": ("price_list_url", "price"),
    "brochure": ("brochure_url", "brochure"),
}
PRECON_GATED_META_KEYS = frozenset(key for key, _ in PRECON_DOCUMENT_TYPES.values())


def _is_gated_attachment(attachment):
    title = (attachment.title or "").lower()
    return any(keyword in title for _, keyword in PRECON_DOCUMENT_TYPES.values())


def resolve_precon_document_url(content, doc_type):
    """Source URL for a gated document, or "" when the project has none."""
    if content is None or doc_type not in PRECON_DOCUMENT_TYPES:
        return ""
    meta_key, keyword = PRECON_DOCUMENT_TYPES[doc_type]
    meta_url = next(
        (str(m.value or "").strip() for m in content.meta.all() if m.key == meta_key),
        "",
    )
    if meta_url:
        return meta_url
    attachment = next(
        (
            item
            for item in content.attachments.all()
            if item.url and keyword in (item.title or "").lower()
        ),
        None,
    )
    return attachment.url if attachment else ""


def _featured_image_url(obj):
    """First image attachment; shared by the list and detail serializers."""
    if not obj.content_id:
        return None
    attachment = next(
        (
            item
            for item in obj.content.attachments.all()
            if item.url
            and not _is_gated_attachment(item)
            and (
                (item.mime_type or "").startswith("image/")
                or item.url.lower().split("?")[0].endswith(
                    (".jpg", ".jpeg", ".png", ".webp", ".gif")
                )
            )
        ),
        None,
    )
    return attachment.url if attachment else None


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = "__all__"


class TaxonomySerializer(serializers.ModelSerializer):
    class Meta:
        model = Taxonomy
        fields = "__all__"


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = "__all__"


class ContentMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentMeta
        fields = "__all__"


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = "__all__"


class PreComPropertyDetailSerializer(serializers.ModelSerializer):
    """Detail response including nested Content, author, taxonomies, media, meta."""

    wp_id = serializers.IntegerField(source="content.wp_id", read_only=True)
    title = serializers.CharField(source="content.title", read_only=True)
    slug = serializers.CharField(source="content.slug", read_only=True)
    status = serializers.CharField(source="content.status", read_only=True)
    content_type = serializers.CharField(source="content.content_type", read_only=True)
    body = serializers.CharField(source="content.content", read_only=True)
    excerpt = serializers.CharField(source="content.excerpt", read_only=True)
    published_at = serializers.DateTimeField(source="content.published_at", read_only=True)
    author = serializers.SerializerMethodField()
    taxonomies = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()
    featured_image_url = serializers.SerializerMethodField()
    has_floor_plan = serializers.SerializerMethodField()
    has_price_list = serializers.SerializerMethodField()
    has_brochure = serializers.SerializerMethodField()

    class Meta:
        model = PreComProperty
        fields = [
            "id",
            "wp_id",
            "title",
            "slug",
            "status",
            "content_type",
            "body",
            "excerpt",
            "published_at",
            "price",
            "bedrooms",
            "bathrooms",
            "garages",
            "area",
            "lot_size",
            "latitude",
            "longitude",
            "address",
            "author",
            "taxonomies",
            "attachments",
            "meta",
            "developer_name",
            "sales_stage",
            "featured_image_url",
            "has_floor_plan",
            "has_price_list",
            "has_brochure",
        ]

    def get_author(self, obj):
        author = getattr(obj.content, "author", None) if obj.content_id else None
        if not author:
            return None
        return {
            "id": author.id,
            "display_name": author.display_name,
            "email": author.email,
        }

    def get_taxonomies(self, obj):
        if not obj.content_id:
            return []
        return [
            {"id": t.id, "taxonomy": t.taxonomy, "name": t.name, "slug": t.slug}
            for t in obj.content.taxonomies.all()
        ]

    def get_attachments(self, obj):
        if not obj.content_id:
            return []
        # Floor plan / price list / brochure attachments are gated, so they are
        # left out here; `has_*` tells the page whether to enable the button.
        return [
            {"id": a.id, "url": a.url, "mime_type": a.mime_type, "title": a.title}
            for a in obj.content.attachments.all()
            if not _is_gated_attachment(a)
        ]

    def get_meta(self, obj):
        if not obj.content_id:
            return {}
        return {
            m.key: m.value
            for m in obj.content.meta.all()
            if m.key not in PRECON_GATED_META_KEYS
        }

    def get_featured_image_url(self, obj):
        return _featured_image_url(obj)

    def _has_document(self, obj, doc_type):
        return bool(obj.content_id and resolve_precon_document_url(obj.content, doc_type))

    def get_has_floor_plan(self, obj):
        return self._has_document(obj, "floor_plan")

    def get_has_price_list(self, obj):
        return self._has_document(obj, "price_list")

    def get_has_brochure(self, obj):
        return self._has_document(obj, "brochure")


class PreComPropertySerializer(serializers.ModelSerializer):
    """Flat list serializer with one representative image URL."""

    wp_id = serializers.IntegerField(source="content.wp_id", read_only=True)
    title = serializers.CharField(source="content.title", read_only=True)
    slug = serializers.CharField(source="content.slug", read_only=True)
    status = serializers.CharField(source="content.status", read_only=True)
    featured_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PreComProperty
        fields = [
            "id",
            "wp_id",
            "title",
            "slug",
            "status",
            "price",
            "bedrooms",
            "bathrooms",
            "garages",
            "area",
            "lot_size",
            "latitude",
            "longitude",
            "address",
            "featured_image_url",
            "developer_name",
            "sales_stage",
        ]

    def get_featured_image_url(self, obj):
        return _featured_image_url(obj)


class PreComBulkUploadSerializer(serializers.Serializer):
    file = serializers.FileField(
        help_text="CSV or Excel (.xlsx/.xls) file with PreComProperty rows.",
    )


class PreComBulkRowErrorSerializer(serializers.Serializer):
    row = serializers.IntegerField()
    wp_id = serializers.CharField(required=False, allow_blank=True)
    error = serializers.CharField()


class PreComBulkUploadResponseSerializer(serializers.Serializer):
    created = serializers.IntegerField()
    updated = serializers.IntegerField()
    skipped = serializers.IntegerField()
    errors = PreComBulkRowErrorSerializer(many=True)
