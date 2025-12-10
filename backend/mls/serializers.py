# api/serializers.py
from rest_framework import serializers
from mls.models import Property, Room, Media


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['media_url', 'media_category', 'is_preferred', 'order']


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
            return {
                "media_url": preferred.media_url,
                "media_category": preferred.media_category,
                "is_preferred": True
            }

        # 2. Fallback: get the first photo by order
        first = obj.media.order_by('order').first()
        if first:
            return {
                "media_url": first.media_url,
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
