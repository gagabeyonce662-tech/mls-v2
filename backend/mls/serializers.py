# api/serializers.py
from rest_framework import serializers
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from django.db.models import Prefetch, prefetch_related_objects
from django.db.models.manager import BaseManager
from django.utils import timezone
from mls.models import (
    Property,
    CommunityListing,
    Room,
    Media,
    OpenHouse,
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
    SavedSearch,
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


# `to_attr` names for the batched lookups below. PropertySerializer reads
# them when present and falls back to per-row queries when absent, so single
# serialisation (detail, nested) is unchanged.
PRIMARY_MEDIA_ATTR = "primary_media"
NEXT_OPEN_HOUSE_ATTR = "next_open_houses"


def prefetch_property_summaries(properties):
    """
    Batch-load the summary's photo and next open house for many properties.

    Without this each row cost 2-3 queries (preferred photo, first photo, next
    open house): ~300 for one 100-pin map viewport. Sliced prefetches (Django
    4.2+) fetch exactly one row per property in one query per relation.
    """
    if not properties:
        return
    prefetch_related_objects(
        properties,
        Prefetch(
            "media",
            # Preferred photo first, then feed order: the same pick as the
            # per-row fallback in get_media.
            queryset=Media.objects.order_by("-is_preferred", "order", "pk")[:1],
            to_attr=PRIMARY_MEDIA_ATTR,
        ),
        Prefetch(
            "open_houses",
            queryset=OpenHouse.objects.filter(date__gte=timezone.localdate()).order_by(
                "date", "start_time", "pk"
            )[:1],
            to_attr=NEXT_OPEN_HOUSE_ATTR,
        ),
    )


class PropertyListSerializer(serializers.ListSerializer):
    """Every `PropertySerializer(many=True)` prefetches its per-row relations."""

    def to_representation(self, data):
        items = list(data.all() if isinstance(data, BaseManager) else data)
        prefetch_property_summaries([item for item in items if isinstance(item, Property)])
        return super().to_representation(items)


class PropertySerializer(serializers.ModelSerializer):
    # media = MediaSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    next_open_house = serializers.SerializerMethodField()
    # rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        list_serializer_class = PropertyListSerializer
        fields = [
            'listing_key', 'list_price',"property_sub_type",'city',"lease_amount", 'postal_code', 'unparsed_address',
            'bedrooms_total', 'bathrooms_total_integer', 'building_area_total',"listing_id","city","directions","city_region",
            'year_built', 'public_remarks', 'listing_url', 'category_type',"state_or_province","lease_amount",
            # Most DDF rentals carry their monthly rent here, not in lease_amount.
            "total_actual_rent",
            'latitude', 'longitude', 'photos_count', 'standard_status',
            'media',
            'close_price', 'close_date',
            'previous_list_price', 'price_change_timestamp',
            'next_open_house',
            'original_entry_timestamp',
            # Home type: property_sub_type is "Single Family" for most rows.
            'structure_type', 'property_attached_yn',
            'virtual_tour_url',
            # 'rooms'
        ]

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_next_open_house(self, obj):
        from django.utils import timezone as _tz
        from datetime import datetime as _dt, time as _time
        events = getattr(obj, NEXT_OPEN_HOUSE_ATTR, None)
        if events is None:
            today = _tz.localdate()
            events = obj.open_houses.filter(date__gte=today).order_by("date", "start_time")[:1]
        event = next(iter(events), None)
        if not event or not event.date:
            return None
        start_time = event.start_time or _time(0, 0)
        end_time = event.end_time or _time(23, 59)
        tz = _tz.get_current_timezone()
        try:
            start_dt = _tz.make_aware(_dt.combine(event.date, start_time), tz)
            end_dt = _tz.make_aware(_dt.combine(event.date, end_time), tz)
        except Exception:
            start_dt = _dt.combine(event.date, start_time)
            end_dt = _dt.combine(event.date, end_time)
        return {
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
        }
    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_media(self, obj):
        prefetched = getattr(obj, PRIMARY_MEDIA_ATTR, None)
        if prefetched is not None:
            media = prefetched[0] if prefetched else None
        else:
            # Unbatched: the preferred photo, else the first by feed order.
            media = obj.media.filter(is_preferred=True).first() or obj.media.order_by('order').first()
        if media is None:
            return None

        url = media.media_url
        if media.media_file:
            try:
                url = media.media_file.url
            except Exception:
                pass
        return {
            "media_url": url,
            "media_category": media.media_category,
            "is_preferred": media.is_preferred,
        }

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
    next_open_house = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = '__all__'

    # Reuse the exact implementation from PropertySerializer so list + detail
    # return an identical shape (GAP-23: fields='__all__' skips method fields).
    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_next_open_house(self, obj):
        return PropertySerializer.get_next_open_house(self, obj)


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
    # GAP-14: a VIP / newsletter registration legitimately has nothing to say,
    # and the rule that allows that lives in validate() below. The model field
    # is a plain TextField, so ModelSerializer would infer allow_blank=False
    # and reject message="" during FIELD validation - before validate() ever
    # runs - making the documented registration payload fail with
    # "This field may not be blank." Accepting a blank string here lets
    # validate() apply the real rule: >=10 chars for an ordinary inquiry,
    # a substituted sentence for a registration.
    message = serializers.CharField(allow_blank=True, required=False, default="")

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
            "listing_key",
            "project",
            "is_vip_list",
            "newsletter_opt_in",
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

    def validate(self, attrs):
        # VIP / newsletter-only signups do not need a 10-char message.
        is_registration = bool(
            attrs.get("project") or attrs.get("is_vip_list") or attrs.get("newsletter_opt_in")
        )
        message = (attrs.get("message") or "").strip()
        if not is_registration and len(message) < 10:
            raise serializers.ValidationError(
                {"message": "Please enter at least 10 characters describing what you are looking for."}
            )
        if is_registration and not message:
            # Preserve the requirement's non-empty semantics on the model column.
            attrs["message"] = "Registered interest via preconstruction form."
        return attrs


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
            "province", "postal_code", "country", "property_type", "ownership_title",
            "bedrooms", "bathrooms", "storeys", "floors", "parking", "locker",
            "maintenance_fees", "interior_area_sqft", "asking_price", "available_from",
            "description", "project_name", "builder_name", "precon_property",
            "agreement_date", "occupancy_date", "original_purchase_price", "deposit_paid",
            "assignment_fee", "consent_to_advertise", "contact_name", "contact_email",
            "contact_phone", "ownership_confirmed", "publication_consent", "review_note",
            "submitted_at", "reviewed_at", "created_at", "updated_at", "media",
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

        # Evaluate assignment requirements against the merged state so a partial
        # PATCH (e.g. only pricing fields) does not fail on fields it didn't send,
        # while switching purpose to "assignment" still demands the extras.
        def merged(field):
            if field in attrs:
                return attrs[field]
            return getattr(instance, field, None) if instance else None

        if merged("purpose") == ListingSubmission.Purpose.ASSIGNMENT:
            required = {
                "project_name": "Enter the pre-construction project name.",
                "builder_name": "Enter the builder name.",
                "occupancy_date": "Enter the expected occupancy date.",
                "original_purchase_price": "Enter the original purchase price.",
            }
            errors = {}
            for field, message in required.items():
                value = merged(field)
                if value is None or (isinstance(value, str) and not value.strip()):
                    errors[field] = message
            if errors:
                raise serializers.ValidationError(errors)
        return attrs


class PublicListingSubmissionSerializer(serializers.ModelSerializer):
    """Safe public representation: no owner contact or private documents."""

    media = serializers.SerializerMethodField()
    source_label = serializers.CharField(source="get_submitter_type_display", read_only=True)

    class Meta:
        model = ListingSubmission
        fields = [
            "id", "source_label", "purpose", "address_line_1", "address_line_2", "city",
            "province", "postal_code", "country", "property_type", "ownership_title",
            "bedrooms", "bathrooms", "storeys", "floors", "parking", "locker",
            "maintenance_fees", "interior_area_sqft", "asking_price", "available_from",
            "description",
            # Assignment context that is safe to publish; the seller's purchase
            # price, deposit and assignment fee stay private to the reviewer.
            "project_name", "builder_name", "agreement_date", "occupancy_date", "media",
            "precon_property", "published_at",
        ]

    published_at = serializers.DateTimeField(source="reviewed_at", read_only=True)

    def get_media(self, obj):
        # Filter the prefetched rows in Python: .filter() here issued one
        # query per submission and ignored prefetch_related("media").
        return [
            ListingSubmissionMediaSerializer(item, context=self.context).data
            for item in obj.media.all()
            if item.media_type == ListingSubmissionMedia.MediaType.PHOTO
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


class SavedSearchSerializer(serializers.ModelSerializer):
    """Round-trip serializer for GAP-03 SavedSearch endpoints.

    filters_json is stored as the raw query params (e.g. {"city": "Toronto",
    "price_max": "900000"}) so it can be replayed by expanding it into the
    /properties/filter/ URL.
    """

    class Meta:
        model = SavedSearch
        fields = [
            "id",
            "name",
            "filters_json",
            "alert_cadence",
            "last_run_at",
            "last_result_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "last_run_at",
            "last_result_count",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Name is required.")
        return value

    def validate_filters_json(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("filters_json must be an object.")
        # Guard against unbounded payloads (~4 KB is plenty for query params).
        if len(str(value)) > 4096:
            raise serializers.ValidationError("filters_json is too large.")
        # Coerce every value to a scalar string so replay produces a clean URL.
        return {str(k): ("" if v is None else str(v)) for k, v in value.items()}


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
