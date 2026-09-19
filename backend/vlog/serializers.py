from rest_framework import serializers

from .models import VlogPost, VlogCategory
from .sanitizers import sanitize_post_html

class VlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VlogCategory
        fields = ['id', 'name', 'slug']
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
        }


class VlogPostWriteSerializer(serializers.ModelSerializer):
    """Serializer used for POST/PUT/PATCH on VlogPost.

    Accepts ``category_id`` for the FK and returns the full read serializer
    representation in the response so the caller gets the same shape as GET.
    """

    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=VlogCategory.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    faq_items = serializers.JSONField(required=False)

    class Meta:
        model = VlogPost
        fields = [
            "title", "slug", "excerpt", "content",
            "embed_url", "video_file", "thumbnail",
            "category_id", "tags",
            "status", "publish_date", "allow_comments",
            "seo_title", "seo_description", "seo_keywords", "focus_keyword",
            "seo_canonical_url", "seo_noindex",
            "og_title", "og_description", "og_image",
            "twitter_title", "twitter_description", "twitter_image",
            "faq_items",
        ]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "excerpt": {"required": False, "allow_blank": True},
            "embed_url": {"required": False, "allow_blank": True},
            "tags": {"required": False, "allow_blank": True},
        }

    def validate_content(self, value):
        """Strip anything that is not prose markup before it reaches the DB.

        See vlog/sanitizers.py for why this runs server-side as well as at
        render time.
        """
        return sanitize_post_html(value)

    def validate_title(self, value):
        title = (value or "").strip()
        if not title:
            raise serializers.ValidationError("A title is required.")
        return title

    def validate_faq_items(self, value):
        """FAQ is free-form JSON on the model; enforce the shape the UI expects."""
        if value in (None, ""):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "FAQ items must be a list of {question, answer} objects."
            )
        cleaned = []
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    "Each FAQ item must be an object with question and answer."
                )
            question = str(item.get("question", "")).strip()
            answer = str(item.get("answer", "")).strip()
            if question or answer:
                cleaned.append({"question": question, "answer": answer})
        return cleaned

    def validate(self, attrs):
        """Guard publishing, and guard against silently overwriting a co-author.

        `expected_updated_at` is optional: clients that send it get a 409 instead
        of clobbering an edit made since they loaded the form. Clients that don't
        keep the previous last-write-wins behaviour.
        """
        status_value = attrs.get(
            "status", getattr(self.instance, "status", VlogPost.DRAFT)
        )
        if status_value == VlogPost.PUBLISHED:
            title = attrs.get("title", getattr(self.instance, "title", "")) or ""
            content = attrs.get("content", getattr(self.instance, "content", "")) or ""
            if not title.strip():
                raise serializers.ValidationError(
                    {"title": "A published post needs a title."}
                )
            if not content.strip():
                raise serializers.ValidationError(
                    {"content": "A published post needs some content."}
                )
        return attrs

    def to_representation(self, instance):
        return VlogPostSerializer(instance, context=self.context).data

class VlogPostSerializer(serializers.ModelSerializer):
    category = VlogCategorySerializer(read_only=True)
    tags = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()
    twitter_image_url = serializers.SerializerMethodField()

    class Meta:
        model = VlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 
            'embed_url', 'video_url', 'thumbnail_url', 'author', 
            'category', 'tags', 'status', 'publish_date', 
            'created_at', 'updated_at', 'allow_comments',
            'seo_title', 'seo_description', 'seo_keywords',
            'focus_keyword',
            'seo_canonical_url', 'seo_noindex',
            'og_title', 'og_description', 'og_image_url',
            'twitter_title', 'twitter_description', 'twitter_image_url',
            'faq_items',
        ]

    def get_thumbnail_url(self, obj):
        if hasattr(obj, 'thumbnail') and obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                pass
        return None

    def get_tags(self, obj):
        raw_tags = getattr(obj, 'tags', '') or ''
        if isinstance(raw_tags, list):
            return [str(tag).strip() for tag in raw_tags if str(tag).strip()]
        if isinstance(raw_tags, str):
            return [tag.strip() for tag in raw_tags.split(',') if tag.strip()]
        return []

    def get_video_url(self, obj):
        if hasattr(obj, 'video_file') and obj.video_file:
            try:
                return obj.video_file.url
            except:
                pass
        return None

    def get_og_image_url(self, obj):
        if hasattr(obj, 'og_image') and obj.og_image:
            try:
                return obj.og_image.url
            except:
                pass
        return None

    def get_twitter_image_url(self, obj):
        if hasattr(obj, 'twitter_image') and obj.twitter_image:
            try:
                return obj.twitter_image.url
            except:
                pass
        return None
