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
    media = MediaSerializer(many=True, read_only=True)
    rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            'listing_key', 'list_price', 'city', 'postal_code', 'unparsed_address',
            'bedrooms_total', 'bathrooms_total_integer', 'building_area_total',
            'year_built', 'public_remarks', 'listing_url', 'category_type',
            'latitude', 'longitude', 'photos_count', 'standard_status',
            'media', 'rooms'
        ]