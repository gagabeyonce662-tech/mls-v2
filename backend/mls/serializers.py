# api/serializers.py
from rest_framework import serializers
from mls.models import (
    Property,
    Room,
    Media,
    UserFeedback,
    UserFavorite,
    UserHistory,
)


class MediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ['url', 'media_url', 'media_file', 'media_category', 'is_preferred', 'order']

    def get_url(self, obj):
        # Defensive check for cases where migrations haven't run yet
        if hasattr(obj, 'media_file') and obj.media_file:
            try:
                return obj.media_file.url
            except:
                pass
        return getattr(obj, 'media_url', '')


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['room_type', 'room_level', 'room_length', 'room_width', 'room_dimensions']


class PropertySerializer(serializers.ModelSerializer):
    # media = MediaSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    # rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            'listing_key', 'list_price',"property_sub_type",'city',"lease_amount", 'postal_code', 'unparsed_address',
            'bedrooms_total', 'bathrooms_total_integer', 'building_area_total',"listing_id","city","directions","city_region",
            'year_built', 'public_remarks', 'listing_url', 'category_type',"state_or_province","lease_amount",
            'latitude', 'longitude', 'photos_count', 'standard_status',
            'media', 
            # 'rooms'
        ]
    def get_media(self, obj):
        # 1. Try to get the preferred photo
        preferred = obj.media.filter(is_preferred=True).first()
        if preferred:
            # Defensive check for media_file
            url = preferred.media_url
            if hasattr(preferred, 'media_file') and preferred.media_file:
                try:
                    url = preferred.media_file.url
                except:
                    pass
            return {
                "media_url": url,
                "media_category": preferred.media_category,
                "is_preferred": True
            }

        # 2. Fallback: get the first photo by order
        first = obj.media.order_by('order').first()
        if first:
            url = first.media_url
            if hasattr(first, 'media_file') and first.media_file:
                try:
                    url = first.media_file.url
                except:
                    pass
            return {
                "media_url": url,
                "media_category": first.media_category,
                "is_preferred": False
            }

        # 3. No photos
        return None

class RoomDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'  



class MediaDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = '__all__' 


class PropertyDetailSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    media = MediaSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = '__all__' 


class UserFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFeedback
        fields = [
            "id",
            "page_url",
            "name",
            "email",
            "feedback_type",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]


class WatchedMutationSerializer(serializers.Serializer):
    property_key = serializers.CharField(max_length=255)
    property_snapshot_json = serializers.JSONField(required=False, default=dict)


class UserFavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFavorite
        fields = ["property_key", "property_snapshot_json", "created_at"]


class UserHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserHistory
        fields = ["property_key", "property_snapshot_json", "viewed_at"]
