from decimal import ROUND_HALF_UP, Decimal

from rest_framework import serializers

from .models import BuyerIncentive, CommunityImage, NearbyAlert, NewsArticle, Partner
from .services.subscriptions import MAX_RADIUS_KM


class BuyerIncentiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerIncentive
        fields = ["id", "title", "label", "icon", "amount_text", "description", "source_url", "reviewed_at"]


class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = ["id", "name", "category", "description", "logo_url", "website_url"]


class CommunityImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityImage
        fields = ["city_key", "city_label", "image_url", "credit"]


class NewsArticleSerializer(serializers.ModelSerializer):
    source = serializers.CharField(source="source.name")

    class Meta:
        model = NewsArticle
        fields = ["id", "title", "url", "summary", "image_url", "tag", "source", "published_at"]


class ConsentField(serializers.BooleanField):
    """Must be literally true: CASL needs an affirmative act, so a missing or
    false value is a validation error, not a default."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        if value is not True:
            raise serializers.ValidationError("Consent is required to subscribe.")
        return value


class NewsletterSubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    consent = ConsentField()
    source = serializers.CharField(max_length=80, required=False, default="homepage")


class NearbyAlertCreateSerializer(serializers.Serializer):
    """Alerts always go to the signed-in account's own address — accepting an
    email field would let one user enrol someone else's inbox."""

    label = serializers.CharField(max_length=255)
    # Geocoders return 7+ decimals; round (≈10 cm) rather than reject.
    latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, rounding=ROUND_HALF_UP,
        min_value=Decimal("-90"), max_value=Decimal("90"),
    )
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, rounding=ROUND_HALF_UP,
        min_value=Decimal("-180"), max_value=Decimal("180"),
    )
    radius_km = serializers.DecimalField(
        max_digits=4, decimal_places=1, required=False, default=Decimal("1"),
        min_value=Decimal("0.2"), max_value=MAX_RADIUS_KM,
    )
    consent = ConsentField()

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.email:
            raise serializers.ValidationError("Add an email address to your account to receive alerts.")
        attrs["email"] = user.email.strip().lower()
        attrs["user"] = user
        return attrs


class NearbyAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = NearbyAlert
        fields = ["id", "label", "latitude", "longitude", "radius_km", "created_at", "last_notified_at"]


class TokenSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=["newsletter", "nearby"])
    token = serializers.CharField(max_length=64)
