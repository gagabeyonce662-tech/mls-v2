from rest_framework import serializers
from .models import VlogPost, VlogCategory

class VlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VlogCategory
        fields = ['id', 'name', 'slug']

class VlogPostSerializer(serializers.ModelSerializer):
    category = VlogCategorySerializer(read_only=True)
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
        ]

    def get_thumbnail_url(self, obj):
        if hasattr(obj, 'thumbnail') and obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                pass
        return None

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
