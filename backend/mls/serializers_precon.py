from rest_framework import serializers

from mls.models import (
    Attachment,
    Author,
    Content,
    ContentMeta,
    PreComProperty,
    Taxonomy,
)


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
        return [
            {"id": a.id, "url": a.url, "mime_type": a.mime_type, "title": a.title}
            for a in obj.content.attachments.all()
        ]

    def get_meta(self, obj):
        if not obj.content_id:
            return {}
        return {m.key: m.value for m in obj.content.meta.all()}


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
        ]

    def get_featured_image_url(self, obj):
        if not obj.content_id:
            return None

        attachment = next(
            (
                item
                for item in obj.content.attachments.all()
                if item.url
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
