from rest_framework import serializers
from .models import VlogPost, VlogCategory

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

    def validate(self, attrs):
        if not attrs.get("embed_url") and not attrs.get("video_file") and self.instance is None:
            # Content-only posts are allowed; video/embed both remain optional.
            pass
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
