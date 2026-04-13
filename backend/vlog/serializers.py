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

    class Meta:
        model = VlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 
            'embed_url', 'video_url', 'thumbnail_url', 'author', 
            'category', 'tags', 'status', 'publish_date', 
            'created_at', 'updated_at', 'allow_comments'
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
