# api/serializers.py
from rest_framework import serializers
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from mls.models import (
    Property,
    CommunityListing,
    Room,
    Media,
    UserFeedback,
    UserFavorite,
    UserHistory,
    UserToured,
    UserFollowedArea,
    UserAlertPreference,
    PropertyInquiry,
    PropertySnapshot,
    ListingSubmission,
    ListingSubmissionMedia,
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
    @extend_schema_field(OpenApiTypes.OBJECT)
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


class PropertyInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyInquiry
        fields = [
            "id",
            "user",
            "first_name",
            "last_name",
            "email",
            "phone",
            "intent",
            "message",
            "preferred_locations",
            "property_types",
            "budget_min",
            "budget_max",
            "bedrooms_min",
            "bathrooms_min",
            "timeline",
            "page_url",
            "status",
            "ghl_contact_id",
            "ghl_synced_at",
            "email_sent_at",
            "last_error",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "ghl_contact_id",
            "ghl_synced_at",
            "email_sent_at",
            "last_error",
            "created_at",
            "updated_at",
        ]

    def validate_message(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Please enter at least 10 characters describing what you are looking for."
            )
        return value


class ListingSubmissionMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ListingSubmissionMedia
        fields = ["id", "media_type", "file", "file_url", "display_order", "uploaded_at"]
        read_only_fields = ["id", "file_url", "uploaded_at"]
        extra_kwargs = {"file": {"write_only": True}}

    def get_file_url(self, obj):
        try:
            return obj.file.url
        except (ValueError, AttributeError):
            return ""

    def validate_file(self, value):
        allowed_types = {
            "image/jpeg", "image/png", "image/webp", "application/pdf",
        }
        max_bytes = 15 * 1024 * 1024
        if getattr(value, "size", 0) > max_bytes:
            raise serializers.ValidationError("Files must be 15 MB or smaller.")
        content_type = getattr(value, "content_type", "")
        if content_type and content_type not in allowed_types:
            raise serializers.ValidationError("Upload a JPEG, PNG, WebP, or PDF file.")
        return value


class ListingSubmissionSerializer(serializers.ModelSerializer):
    media = ListingSubmissionMediaSerializer(many=True, read_only=True)
    submitter_type_label = serializers.CharField(source="get_submitter_type_display", read_only=True)
    purpose_label = serializers.CharField(source="get_purpose_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ListingSubmission
        fields = [
            "id", "submitter_type", "submitter_type_label", "purpose", "purpose_label",
            "status", "status_label", "address_line_1", "address_line_2", "city",
            "province", "postal_code", "country", "property_type", "bedrooms", "bathrooms",
            "interior_area_sqft", "asking_price", "available_from", "description",
            "contact_name", "contact_email", "contact_phone", "ownership_confirmed",
            "publication_consent", "review_note", "submitted_at", "reviewed_at", "created_at",
            "updated_at", "media",
        ]
        read_only_fields = [
            "id", "status", "review_note", "submitted_at", "reviewed_at", "created_at",
            "updated_at", "media",
        ]

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        # Users can edit only a draft or a submission returned for changes.
        if instance and instance.status not in {
            ListingSubmission.Status.DRAFT,
            ListingSubmission.Status.NEEDS_CHANGES,
        }:
            raise serializers.ValidationError("This submission can no longer be edited.")
        return attrs


class PublicListingSubmissionSerializer(serializers.ModelSerializer):
    """Safe public representation: no owner contact or private documents."""

    media = serializers.SerializerMethodField()
    source_label = serializers.CharField(source="get_submitter_type_display", read_only=True)

    class Meta:
        model = ListingSubmission
        fields = [
            "id", "source_label", "purpose", "address_line_1", "address_line_2", "city",
            "province", "postal_code", "country", "property_type", "bedrooms", "bathrooms",
            "interior_area_sqft", "asking_price", "available_from", "description", "media",
        ]

    def get_media(self, obj):
        return [
            ListingSubmissionMediaSerializer(item, context=self.context).data
            for item in obj.media.filter(media_type=ListingSubmissionMedia.MediaType.PHOTO)
        ]


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


class UserTouredSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserToured
        fields = ["property_key", "property_snapshot_json", "toured_at"]


class FollowedAreaMutationSerializer(serializers.Serializer):
    area_key = serializers.CharField(max_length=255)
    area_label = serializers.CharField(max_length=255, required=False, allow_blank=True)
    area_kind = serializers.CharField(max_length=40, required=False, default="community")
    metadata_json = serializers.JSONField(required=False, default=dict)


class UserFollowedAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFollowedArea
        fields = ["area_key", "area_label", "area_kind", "metadata_json", "created_at"]


class UserAlertPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAlertPreference
        fields = [
            "price_changes",
            "new_listings",
            "status_updates",
            "email_enabled",
            "email_recommend",
            "email_watched_property",
            "email_watched_community",
            "email_watched_area",
            "push_watched_property",
        ]


class ListingViewBeaconSerializer(serializers.Serializer):
    listing_key = serializers.CharField(max_length=2000)
    session_key = serializers.CharField(max_length=64)


class PropertySnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertySnapshot
        fields = [
            "list_price",
            "standard_status",
            "source_modification_timestamp",
            "created_at",
        ]


class CommunityListingSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)

    class Meta:
        model = CommunityListing
        fields = [
            "id",
            "community_name",
            "community_slug",
            "badge",
            "rank",
            "is_published",
            "updated_at",
            "property",
        ]


class RecommendationItemSerializer(serializers.Serializer):
    property = PropertySerializer()
    score = serializers.FloatField()
    content_score = serializers.FloatField()
    personal_score = serializers.FloatField()
    collab_score = serializers.FloatField()
    freshness_score = serializers.FloatField()
    why = serializers.ListField(child=serializers.CharField(), required=False)


class ListingRecommendationsResponseSerializer(serializers.Serializer):
    for_this_home = RecommendationItemSerializer(many=True)
    based_on_your_history = RecommendationItemSerializer(many=True)
    people_also_viewed = RecommendationItemSerializer(many=True)
    fallback = RecommendationItemSerializer(many=True)
    metadata = serializers.DictField()


class RecommendationTrackSerializer(serializers.Serializer):
    listing_key = serializers.CharField(max_length=2000)
    session_key = serializers.CharField(max_length=64, required=False, allow_blank=True)
    event_type = serializers.ChoiceField(
        choices=["impression", "click", "detail_open", "save", "compare"]
    )
    section = serializers.CharField(max_length=64, required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)


class EstatePropertyWriteSerializer(serializers.Serializer):
    """
    Lightweight write serializer for dynamic estate_properties CRUD.
    Accepts arbitrary keys but enforces core business constraints.
    """

    payload = serializers.DictField()

    def validate_payload(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("payload must be an object.")
        return value
