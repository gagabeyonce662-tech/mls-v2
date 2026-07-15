from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from PIL import Image, UnidentifiedImageError
from datetime import timedelta
from django.utils import timezone
from .helpers import regenerate_access_token_with_refresh_token

class AccessToken(models.Model):
    access_token = models.CharField(max_length=5000,blank=True, null=True)
    refresh_token = models.CharField(max_length=5000, blank=True, null=True)
    access_token_expires_at = models.DateTimeField()
    refresh_token_expires_at = models.DateTimeField()

    def __str__(self):
        return self.access_token

    @classmethod
    def get_valid_token(cls):
        """
        Returns the valid access token if still valid. Otherwise, returns None.
        """
        token = cls.objects.first()
        if token and token.access_token_expires_at > timezone.now():
            return token.access_token
        return None

    @classmethod
    def regenerate_token(cls, token_data):
        """
        Regenerates both access token and refresh token and saves them to the database.
        """
        token, created = cls.objects.get_or_create(id=1)  
        token.access_token = token_data['access_token']
        token.refresh_token = token_data['refresh_token']
        token.access_token_expires_at = timezone.now() + timedelta(seconds=token_data['access_token_expires_in'])
        token.refresh_token_expires_at = timezone.now() + timedelta(seconds=token_data['refresh_token_expires_in'])
        token.save()
        return token.access_token

    @classmethod
    def refresh_access_token(cls):
        """
        Uses the refresh token to obtain a new access token and refresh token pair.
        """
        token = cls.objects.first()
        if token and token.refresh_token_expires_at > timezone.now():
            # Request a new access token using the refresh token
            token_data = regenerate_access_token_with_refresh_token(token.refresh_token)
            if token_data:
                return cls.regenerate_token(token_data)
        return None


class Property(models.Model):
    EXCLUSIVE = 'exclusive'
    PRE_CONN = 'pre_conn'
    DDF = 'ddf'
    
    STATUS_CHOICES = [
        (EXCLUSIVE, 'Exclusive'),
        (PRE_CONN, 'Pre-Connected'),
        (DDF, 'MLS Sync'),
    ]
    category_type  = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=None,null=True,blank=True
    )
    is_featured = models.BooleanField(default=False)
    is_manual = models.BooleanField(default=False, help_text="If true, automated sync will not overwrite this listing")
    listing_key = models.CharField(max_length=2000, unique=True)
    property_sub_type = models.CharField(max_length=2000, null=True, blank=True)
    documents_available = models.TextField(null=True, blank=True)
    lease_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    lease_amount_frequency = models.CharField(max_length=50, null=True, blank=True)
    business_type = models.TextField(null=True, blank=True)
    lease_per_unit = models.CharField(max_length=50, null=True, blank=True)
    price_per_unit = models.CharField(max_length=50, null=True, blank=True)
    water_body_name = models.CharField(max_length=2000, null=True, blank=True)
    view = models.TextField(null=True, blank=True)
    number_of_buildings = models.IntegerField(null=True, blank=True)
    number_of_units_total = models.IntegerField(null=True, blank=True)
    lot_features = models.TextField(null=True, blank=True)
    lot_size_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    lot_size_dimensions = models.CharField(max_length=2000, null=True, blank=True)
    lot_size_units = models.CharField(max_length=50, null=True, blank=True)
    pool_features = models.TextField(null=True, blank=True)
    road_surface_type = models.TextField(null=True, blank=True)
    current_use = models.TextField(null=True, blank=True)
    possible_use = models.TextField(null=True, blank=True)
    anchors_co_tenants = models.CharField(max_length=2000, null=True, blank=True)
    waterfront_features = models.TextField(null=True, blank=True)
    community_features = models.TextField(null=True, blank=True)
    frontage_length_numeric = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    frontage_length_numeric_units = models.CharField(max_length=50, null=True, blank=True)
    fencing = models.TextField(null=True, blank=True)
    appliances = models.TextField(null=True, blank=True)
    other_equipment = models.TextField(null=True, blank=True)
    security_features = models.TextField(null=True, blank=True)
    total_actual_rent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    existing_lease_type = models.TextField(null=True, blank=True)
    association_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    association_fee_frequency = models.CharField(max_length=50, null=True, blank=True)
    association_name = models.CharField(max_length=2000, null=True, blank=True)
    association_fee_includes = models.TextField(null=True, blank=True)
    original_entry_timestamp = models.DateTimeField(null=True, blank=True)
    modification_timestamp = models.DateTimeField(null=True, blank=True)
    availability_date = models.DateTimeField(null=True, blank=True)
    listing_id = models.CharField(max_length=2000, null=True, blank=True)
    internet_entire_listing_display_yn = models.BooleanField(default=False,null=True, blank=True)
    internet_address_display_yn = models.BooleanField(default=False, null=True, blank=True)
    standard_status = models.CharField(max_length=50, null=True, blank=True)
    status_change_timestamp = models.DateTimeField(null=True, blank=True)
    public_remarks = models.TextField(null=True, blank=True)
    list_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    inclusions = models.TextField(null=True, blank=True)
    list_office_key = models.CharField(max_length=2000, null=True, blank=True)
    colist_office_key = models.CharField(max_length=2000, null=True, blank=True)
    list_agent_key = models.CharField(max_length=2000, null=True, blank=True)
    listing_url = models.URLField(null=True, blank=True)
    origin_system_name = models.CharField(max_length=2000, null=True, blank=True)
    photos_count = models.IntegerField(null=True, blank=True)
    photos_change_timestamp = models.DateTimeField(null=True, blank=True)
    common_interest = models.CharField(max_length=2000, null=True, blank=True)
    list_aor = models.CharField(max_length=2000, null=True, blank=True)
    unparsed_address = models.CharField(max_length=2000, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    subdivision_name = models.CharField(max_length=2000, null=True, blank=True)
    state_or_province = models.CharField(max_length=2000, null=True, blank=True)
    street_dir_prefix = models.CharField(max_length=50, null=True, blank=True)
    street_dir_suffix = models.CharField(max_length=50, null=True, blank=True)
    street_name = models.CharField(max_length=2000, null=True, blank=True)
    street_number = models.CharField(max_length=50, null=True, blank=True)
    street_suffix = models.CharField(max_length=50, null=True, blank=True)
    unit_number = models.CharField(max_length=50, null=True, blank=True)
    country = models.CharField(max_length=50, null=True, blank=True)
    city = models.CharField(max_length=2000, null=True, blank=True)
    directions = models.CharField(max_length=2000, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    city_region = models.CharField(max_length=2000, null=True, blank=True)
    map_coordinate_verified_yn = models.BooleanField(default=False,null=True, blank=True)
    geocode_manual_yn = models.BooleanField(default=False,null=True, blank=True)
    parking_total = models.IntegerField(null=True, blank=True)
    year_built = models.IntegerField(null=True, blank=True)
    bathrooms_partial = models.IntegerField(null=True, blank=True)
    bathrooms_total_integer = models.IntegerField(null=True, blank=True)
    bedrooms_total = models.IntegerField(null=True, blank=True)
    building_area_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    building_area_units = models.CharField(max_length=50, null=True, blank=True)
    building_features = models.TextField(null=True, blank=True)
    above_grade_finished_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    above_grade_finished_area_units = models.CharField(max_length=50, null=True, blank=True)
    above_grade_finished_area_source = models.CharField(max_length=2000, null=True, blank=True)
    below_grade_finished_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    below_grade_finished_area_units = models.CharField(max_length=50, null=True, blank=True)
    below_grade_finished_area_source = models.CharField(max_length=2000, null=True, blank=True)
    living_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    living_area_units = models.CharField(max_length=50, null=True, blank=True)
    living_area_source = models.CharField(max_length=2000, null=True, blank=True)
    living_area_minimum = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    living_area_maximum = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fireplaces_total = models.IntegerField(null=True, blank=True)
    fireplace_yn = models.BooleanField(default=False,null=True, blank=True)
    fireplace_features = models.TextField(null=True, blank=True)
    architectural_style = models.TextField(null=True, blank=True)
    heating = models.TextField(null=True, blank=True)
    foundation_details = models.TextField(null=True, blank=True)
    basement = models.TextField(null=True, blank=True)
    exterior_features = models.TextField(null=True, blank=True)
    flooring = models.TextField(null=True, blank=True)
    parking_features = models.TextField(null=True, blank=True)
    cooling = models.TextField(null=True, blank=True)
    property_condition = models.TextField(null=True, blank=True)
    roof = models.TextField(null=True, blank=True)
    construction_materials = models.TextField(null=True, blank=True)
    stories = models.IntegerField(null=True, blank=True)
    property_attached_yn = models.BooleanField(null=True, blank=True, default=False)
    accessibility_features = models.TextField(null=True, blank=True)
    bedrooms_above_grade = models.IntegerField(null=True, blank=True)
    bedrooms_below_grade = models.IntegerField(null=True, blank=True)
    zoning = models.CharField(max_length=2000, null=True, blank=True)
    zoning_description = models.CharField(max_length=2000, null=True, blank=True)
    tax_annual_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    tax_block = models.CharField(max_length=2000, null=True, blank=True)
    tax_lot = models.CharField(max_length=2000, null=True, blank=True)
    tax_year = models.IntegerField(null=True, blank=True)
    structure_type = models.TextField(null=True, blank=True)
    parcel_number = models.CharField(max_length=2000, null=True, blank=True)
    utilities = models.TextField(null=True, blank=True)
    irrigation_source = models.TextField(null=True, blank=True)
    water_source = models.TextField(null=True, blank=True)
    sewer = models.TextField(null=True, blank=True)
    electric = models.TextField(null=True, blank=True)
    ai_summary_markdown = models.TextField(null=True, blank=True)
    ai_summary_payload_hash = models.CharField(max_length=64, null=True, blank=True)
    ai_summary_updated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Property {self.listing_key} - {self.city}"


class EstateProperty(models.Model):
    """
    ORM representation of the existing `mls_estateproperty` table.

    The table already exists in production from earlier SQL-first migrations.
    Keep this model unmanaged so Django does not try to create/alter/drop it
    automatically, while still giving us a first-class model contract.
    """
    
    class PublishStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "publish", "Published"
        PENDING = "pending", "Pending Review"
        PRIVATE = "private", "Private"

    publish_status = models.CharField(
        max_length=320,
        choices=PublishStatus.choices,
        default=PublishStatus.DRAFT,
    )

    id = models.BigAutoField(primary_key=True)
    listing_key = models.CharField(max_length=2000, unique=True)
    listing_id = models.CharField(max_length=2000, null=True, blank=True)

    property_title = models.TextField(null=True, blank=True)
    property_slug = models.CharField(max_length=255, null=True, blank=True)
    # publish_status = models.CharField(max_length=32, default="draft", null=True, blank=True)
    property_description = models.TextField(null=True, blank=True)
    featured_image_url = models.TextField(null=True, blank=True)
    featured_image = models.ImageField(
        upload_to="mls/estate-properties/featured",
        blank=True,
        null=True,
    )
    listing_url = models.URLField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    list_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    second_price = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    enable_price_placeholder = models.BooleanField(default=False)
    price_placeholder = models.CharField(max_length=255, null=True, blank=True)
    price_prefix = models.CharField(max_length=255, null=True, blank=True)
    after_price = models.CharField(max_length=255, null=True, blank=True)

    building_area_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    size_postfix = models.CharField(max_length=64, null=True, blank=True)
    land_area = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    land_area_size_postfix = models.CharField(max_length=64, null=True, blank=True)

    bedrooms_total = models.IntegerField(null=True, blank=True)
    rooms = models.IntegerField(null=True, blank=True)
    bathrooms_total_integer = models.IntegerField(null=True, blank=True)
    garages = models.IntegerField(null=True, blank=True)
    garage_size = models.CharField(max_length=128, null=True, blank=True)
    year_built = models.IntegerField(null=True, blank=True)
    property_id_code = models.CharField(max_length=128, null=True, blank=True)
    max_bedrooms = models.IntegerField(null=True, blank=True)
    developer = models.TextField(null=True, blank=True)
    occupancy_year = models.IntegerField(null=True, blank=True)
    signing_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    lot_size = models.CharField(max_length=128, null=True, blank=True)
    kitchens = models.IntegerField(null=True, blank=True)
    tax_annual_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    tax_year = models.IntegerField(null=True, blank=True)
    basement = models.TextField(null=True, blank=True)
    exterior_features = models.TextField(null=True, blank=True)

    unparsed_address = models.CharField(max_length=2000, null=True, blank=True)
    city = models.CharField(max_length=2000, null=True, blank=True)
    state_or_province = models.CharField(max_length=2000, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=50, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)

    standard_status = models.CharField(max_length=50, null=True, blank=True)
    modification_timestamp = models.DateTimeField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    custom_tags = models.TextField(null=True, blank=True)

    wp_meta_json = models.JSONField(default=dict, blank=True)
    wp_terms_json = models.JSONField(default=dict, blank=True)
    wp_post_json = models.JSONField(default=dict, blank=True)
    description_sections_json = models.JSONField(default=list, blank=True)
    custom_detail_blocks_json = models.JSONField(default=list, blank=True)
    detail_blocks_layout_json = models.JSONField(default=list, blank=True)
    listing_buttons_json = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "mls_estateproperty"
        managed = False

    def __str__(self):
        return f"EstateProperty<{self.listing_key}>"

    def clean(self):
        super().clean()
        if self.featured_image:
            if not settings.ESTATE_IMAGE_STORAGE_CONFIGURED:
                raise ValidationError(
                    {"featured_image": "Cloudinary must be configured before uploading estate images."}
                )
            validate_estate_image(self.featured_image)

    @property
    def effective_featured_image_url(self):
        if self.featured_image:
            return estate_image_url(self.featured_image.name)
        return self.featured_image_url


def estate_image_url(name):
    """Return a delivery URL for a stored estate image without persisting it."""
    if not name:
        return None
    try:
        return default_storage.url(name)
    except (ValueError, OSError):
        return None


def validate_estate_image(upload):
    """Validate uploads before storage; Django's ImageField validates again in forms."""
    if not upload:
        return
    max_bytes = settings.ESTATE_IMAGE_MAX_UPLOAD_MB * 1024 * 1024
    if upload.size > max_bytes:
        raise ValidationError(
            f"Image must be {settings.ESTATE_IMAGE_MAX_UPLOAD_MB} MB or smaller."
        )
    try:
        image = Image.open(upload)
        image.verify()
        if image.format not in {"JPEG", "PNG", "WEBP"}:
            raise ValidationError("Upload a JPEG, PNG, or WebP image.")
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError("Upload a valid JPEG, PNG, or WebP image.") from exc
    finally:
        upload.seek(0)


def estate_gallery_upload_path(instance, filename):
    # The database identifier is stable and avoids deriving public IDs from titles.
    return f"mls/estate-properties/gallery/{instance.estate_property_id}/{filename}"


class EstatePropertyImage(models.Model):
    estate_property = models.ForeignKey(
        EstateProperty,
        related_name="gallery_images",
        on_delete=models.CASCADE,
        db_constraint=False,
    )
    image = models.ImageField(upload_to=estate_gallery_upload_path, validators=[validate_estate_image])
    caption = models.CharField(max_length=500, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def clean(self):
        super().clean()
        if self.image and not settings.ESTATE_IMAGE_STORAGE_CONFIGURED:
            raise ValidationError({"image": "Cloudinary must be configured before uploading estate images."})

    @property
    def image_url(self):
        return estate_image_url(self.image.name) if self.image else None


class CommunityListing(models.Model):
    property = models.ForeignKey(
        Property,
        related_name="community_listings",
        on_delete=models.CASCADE,
    )
    community_name = models.CharField(max_length=255)
    community_slug = models.SlugField(max_length=255, db_index=True)
    badge = models.CharField(max_length=120, blank=True, default="")
    rank = models.PositiveIntegerField(default=0, db_index=True)
    is_published = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["rank", "-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["community_slug", "property"],
                name="uniq_communitylisting_slug_property",
            ),
        ]
        indexes = [
            models.Index(fields=["community_slug", "is_published", "rank"]),
        ]

    def __str__(self):
        return f"{self.community_name} -> {self.property.listing_key}"

class Room(models.Model):
    property = models.ForeignKey(Property, related_name='rooms', on_delete=models.CASCADE)
    room_type = models.CharField(max_length=2000)
    room_length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    room_width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    room_level = models.CharField(max_length=2000, null=True, blank=True)
    room_description = models.CharField(max_length=2000, null=True, blank=True)
    room_dimensions = models.CharField(max_length=2000, null=True, blank=True)
    room_length_width_units = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.room_type} - {self.property.listing_key}"

def property_media_path(instance, filename):
    return f'properties/{instance.property.listing_key}/{filename}'

class Media(models.Model):
    property = models.ForeignKey(Property, related_name='media', on_delete=models.CASCADE)
    media_url = models.URLField(max_length=2000)
    media_file = models.ImageField(upload_to=property_media_path, blank=True, null=True)
    media_category = models.TextField(blank=True)
    is_preferred = models.BooleanField(default=False)
    order = models.IntegerField()

    class Meta:
        unique_together = ('property', 'media_url')

    def __str__(self):
        return f"{self.media_category[:50]} - {self.property.listing_key}"


class MapAggregateCell(models.Model):
    h3_index = models.CharField(max_length=32)
    resolution = models.PositiveSmallIntegerField()
    property_count = models.PositiveIntegerField(default=0)
    center_lat = models.DecimalField(max_digits=10, decimal_places=6)
    center_lng = models.DecimalField(max_digits=10, decimal_places=6)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["resolution", "h3_index"]),
            models.Index(fields=["resolution", "updated_at"]),
            models.Index(fields=["resolution", "center_lat", "center_lng"]),
        ]
        unique_together = ("resolution", "h3_index")

    def __str__(self):
        return (
            f"H3({self.resolution}) {self.h3_index} "
            f"=> {self.property_count} properties"
        )


class UserFavorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="watched_favorites",
    )
    property_key = models.CharField(max_length=255)
    property_snapshot_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "property_key"],
                name="unique_user_favorite_property_key",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["property_key"]),
        ]

    def __str__(self):
        return f"Favorite<{self.user_id}:{self.property_key}>"


class UserHistory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="watched_history",
    )
    property_key = models.CharField(max_length=255)
    property_snapshot_json = models.JSONField(default=dict, blank=True)
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "property_key"],
                name="unique_user_history_property_key",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "-viewed_at"]),
            models.Index(fields=["property_key"]),
        ]
        ordering = ["-viewed_at"]

    def __str__(self):
        return f"History<{self.user_id}:{self.property_key}>"


class UserToured(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="watched_toured",
    )
    property_key = models.CharField(max_length=255)
    property_snapshot_json = models.JSONField(default=dict, blank=True)
    toured_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "property_key"],
                name="unique_user_toured_property_key",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "-toured_at"]),
            models.Index(fields=["property_key"]),
        ]
        ordering = ["-toured_at"]

    def __str__(self):
        return f"Toured<{self.user_id}:{self.property_key}>"


class UserFollowedArea(models.Model):
    AREA_KIND_CHOICES = [
        ("community", "Community"),
        ("neighborhood", "Neighborhood"),
        ("region", "Region"),
        ("city", "City"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followed_areas",
    )
    area_key = models.CharField(max_length=255)
    area_label = models.CharField(max_length=255)
    area_kind = models.CharField(max_length=40, choices=AREA_KIND_CHOICES, default="community")
    metadata_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "area_key"],
                name="unique_user_followed_area_key",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["area_key"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Area<{self.user_id}:{self.area_key}>"


class UserAlertPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alert_preferences",
    )
    price_changes = models.BooleanField(default=True)
    new_listings = models.BooleanField(default=True)
    status_updates = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    email_recommend = models.BooleanField(default=True)
    email_watched_property = models.BooleanField(default=True)
    email_watched_community = models.BooleanField(default=True)
    email_watched_area = models.BooleanField(default=True)
    push_watched_property = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AlertPreferences<{self.user_id}>"


class UserFeedback(models.Model):
    FEEDBACK_TYPES = [
        ("general", "General"),
        ("bug", "Bug Report"),
        ("feature", "Feature Request"),
    ]

    page_url = models.URLField(max_length=2000, blank=True, null=True)
    name = models.CharField(max_length=200, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    feedback_type = models.CharField(
        max_length=20,
        choices=FEEDBACK_TYPES,
        default="general",
    )
    message = models.TextField()
    status = models.CharField(max_length=20, default="new")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.feedback_type} feedback ({self.created_at:%Y-%m-%d})"


class PropertyInquiry(models.Model):
    INTENT_CHOICES = [
        ("buy", "Buy"),
        ("sell", "Sell"),
        ("rent", "Rent"),
        ("explore", "Just Exploring"),
    ]
    STATUS_CHOICES = [
        ("new", "New"),
        ("contacted", "Contacted"),
        ("closed", "Closed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_inquiries",
    )
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)

    intent = models.CharField(
        max_length=20,
        choices=INTENT_CHOICES,
        default="buy",
    )
    message = models.TextField(help_text="Free-form description from the user")

    preferred_locations = models.CharField(max_length=500, blank=True)
    property_types = models.CharField(max_length=255, blank=True)
    budget_min = models.PositiveIntegerField(null=True, blank=True)
    budget_max = models.PositiveIntegerField(null=True, blank=True)
    bedrooms_min = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms_min = models.PositiveSmallIntegerField(null=True, blank=True)
    timeline = models.CharField(max_length=80, blank=True)

    page_url = models.URLField(max_length=2000, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="new",
    )

    ghl_contact_id = models.CharField(max_length=255, blank=True)
    ghl_synced_at = models.DateTimeField(null=True, blank=True)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return f"Inquiry<{self.email}:{self.created_at:%Y-%m-%d}>"


class ListingViewEvent(models.Model):
    """Anonymous or authenticated listing page views for on-site engagement metrics."""

    listing_key = models.CharField(max_length=2000, db_index=True)
    session_key = models.CharField(max_length=64, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="listing_view_events",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["listing_key", "created_at"]),
            models.Index(fields=["session_key", "listing_key"]),
        ]


class UserPropertyInteraction(models.Model):
    EVENT_VIEW = "view"
    EVENT_FAVORITE = "favorite"
    EVENT_HISTORY = "history"
    EVENT_TOURED = "toured"
    EVENT_INQUIRY = "inquiry_click"
    EVENT_DETAIL_OPEN = "detail_open"
    EVENT_CHOICES = [
        (EVENT_VIEW, "View"),
        (EVENT_FAVORITE, "Favorite"),
        (EVENT_HISTORY, "History"),
        (EVENT_TOURED, "Toured"),
        (EVENT_INQUIRY, "Inquiry Click"),
        (EVENT_DETAIL_OPEN, "Detail Open"),
    ]

    listing_key = models.CharField(max_length=2000, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="property_interactions",
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    event_type = models.CharField(max_length=32, choices=EVENT_CHOICES, db_index=True)
    source = models.CharField(max_length=64, blank=True, default="web")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["event_type", "created_at"]),
            models.Index(fields=["user", "event_type", "created_at"]),
            models.Index(fields=["session_key", "event_type", "created_at"]),
            models.Index(fields=["listing_key", "event_type", "created_at"]),
        ]


class SearchEvent(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="search_events",
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    query = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=255, blank=True)
    filters_json = models.JSONField(default=dict, blank=True)
    result_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["session_key", "created_at"]),
            models.Index(fields=["city", "created_at"]),
        ]


class PropertyNote(models.Model):
    """Private per-user notes on a listing (by MLS listing key)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="property_notes",
    )
    listing_key = models.CharField(max_length=2000, db_index=True)
    body = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "listing_key"],
                name="uniq_propertynote_user_listing_key",
            ),
        ]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Note<{self.user_id}:{self.listing_key}>"


class PropertySnapshot(models.Model):
    """Point-in-time list price / status from our catalog syncs (not sold history)."""

    listing_key = models.CharField(max_length=2000, db_index=True)
    list_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    standard_status = models.CharField(max_length=80, blank=True)
    source_modification_timestamp = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["listing_key", "-created_at"]),
        ]


class ListingFirstSeen(models.Model):
    """First-seen marker for listings ingested into our catalog."""

    listing_key = models.CharField(max_length=2000, unique=True, db_index=True)
    first_seen_at = models.DateTimeField(auto_now_add=True, db_index=True)
    first_source_modification_timestamp = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-first_seen_at"]
        indexes = [
            models.Index(fields=["-first_seen_at"]),
        ]


class NewsletterDelivery(models.Model):
    STATUS_SENT = "sent"
    STATUS_SKIPPED = "skipped"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_SENT, "Sent"),
        (STATUS_SKIPPED, "Skipped"),
        (STATUS_FAILED, "Failed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="newsletter_deliveries",
    )
    digest_date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SENT)
    listing_count = models.PositiveIntegerField(default=0)
    section_counts = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "digest_date"],
                name="uniq_newsletterdelivery_user_digest_date",
            ),
        ]
        indexes = [
            models.Index(fields=["digest_date", "status"]),
            models.Index(fields=["user", "-created_at"]),
        ]


class CensusFSA(models.Model):
    """Optional FSA-level census profile (imported from public StatsCan-style data)."""

    fsa = models.CharField(max_length=3, primary_key=True)
    data = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.fsa


class PropertySoldProxy(models.Model):
    """
    Internal sold-comp proxy: last list_price when listing left Active,
    derived from PropertySnapshot transitions (no external sold feed).
    """

    listing_key = models.CharField(max_length=2000, unique=True, db_index=True)
    last_list_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    sold_at_proxy = models.DateTimeField(null=True, blank=True, db_index=True)
    fsa = models.CharField(max_length=3, blank=True, db_index=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    bedrooms_total = models.IntegerField(null=True, blank=True)
    bathrooms_total_integer = models.IntegerField(null=True, blank=True)
    bathrooms_partial = models.IntegerField(null=True, blank=True)
    bedrooms_below_grade = models.IntegerField(null=True, blank=True)
    living_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    property_sub_type = models.CharField(max_length=2000, null=True, blank=True)
    lot_size_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    frontage_length_numeric = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    parking_total = models.IntegerField(null=True, blank=True)
    tax_annual_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    city = models.CharField(max_length=2000, null=True, blank=True)
    city_region = models.CharField(max_length=2000, null=True, blank=True)
    unparsed_address = models.CharField(max_length=2000, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["fsa", "sold_at_proxy"]),
            models.Index(fields=["latitude", "longitude"]),
        ]

    def __str__(self):
        return f"SoldProxy<{self.listing_key}>"


class Agent(models.Model):
    """Local agent shown on valuation / contact flows."""

    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    photo_url = models.URLField(blank=True, null=True, max_length=2000)
    brokerage = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class AgentServiceArea(models.Model):
    KIND_FSA = "fsa"
    KIND_CITY = "city"
    KIND_REGION = "region"

    KIND_CHOICES = [
        (KIND_FSA, "FSA (first 3 of postal)"),
        (KIND_CITY, "City"),
        (KIND_REGION, "City region / board area"),
    ]

    agent = models.ForeignKey(Agent, related_name="service_areas", on_delete=models.CASCADE)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, db_index=True)
    key = models.CharField(
        max_length=255,
        db_index=True,
        help_text="FSA code (3 chars), normalized city name, or region slug",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["agent", "kind", "key"], name="uniq_agent_service_area"),
        ]
        indexes = [
            models.Index(fields=["kind", "key"]),
        ]

    def __str__(self):
        return f"{self.agent_id}:{self.kind}:{self.key}"
class EstateProject(models.Model):
    source = models.CharField(max_length=40, default="wordpress")
    source_id = models.CharField(max_length=200)
    source_updated_at = models.DateTimeField(null=True, blank=True)
    title = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True)
    publication_status = models.CharField(max_length=40, default="draft", db_index=True)
    developer = models.CharField(max_length=500, blank=True)
    occupancy_year = models.PositiveSmallIntegerField(null=True, blank=True)
    address = models.CharField(max_length=1000, blank=True)
    city = models.CharField(max_length=255, blank=True, db_index=True)
    province = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    featured_image_url = models.URLField(max_length=2000, blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_featured", "title"]
        constraints = [models.UniqueConstraint(fields=["source", "source_id"], name="uniq_estate_source_id")]
        indexes = [models.Index(fields=["publication_status", "city"])]


class EstateOrderedModel(models.Model):
    display_order = models.PositiveIntegerField(default=0)
    source_key = models.CharField(max_length=255, blank=True, default="")
    parser_owned = models.BooleanField(default=False)

    class Meta:
        abstract = True
        ordering = ["display_order", "id"]


class EstateContentSection(EstateOrderedModel):
    project = models.ForeignKey(EstateProject, related_name="sections", on_delete=models.CASCADE)
    heading = models.CharField(max_length=500, blank=True)
    html = models.TextField(blank=True)

    class Meta(EstateOrderedModel.Meta):
        constraints = [models.UniqueConstraint(fields=["project", "source_key"], condition=~models.Q(source_key=""), name="uniq_estate_section_source")]


class EstateUnitType(EstateOrderedModel):
    project = models.ForeignKey(EstateProject, related_name="unit_types", on_delete=models.CASCADE)
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)

    class Meta(EstateOrderedModel.Meta):
        constraints = [models.UniqueConstraint(fields=["project", "source_key"], condition=~models.Q(source_key=""), name="uniq_estate_unit_source")]


class EstatePrice(EstateOrderedModel):
    project = models.ForeignKey(EstateProject, related_name="prices", on_delete=models.CASCADE)
    unit_type = models.ForeignKey(EstateUnitType, related_name="prices", null=True, blank=True, on_delete=models.SET_NULL)
    display_text = models.CharField(max_length=1000)
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, blank=True)

    class Meta(EstateOrderedModel.Meta):
        constraints = [models.UniqueConstraint(fields=["project", "source_key"], condition=~models.Q(source_key=""), name="uniq_estate_price_source")]


class EstateDepositPlan(EstateOrderedModel):
    project = models.ForeignKey(EstateProject, related_name="deposit_plans", on_delete=models.CASCADE)
    unit_type = models.ForeignKey(EstateUnitType, related_name="deposit_plans", null=True, blank=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=500)

    class Meta(EstateOrderedModel.Meta):
        constraints = [models.UniqueConstraint(fields=["project", "source_key"], condition=~models.Q(source_key=""), name="uniq_estate_deposit_source")]


class EstateDepositInstallment(EstateOrderedModel):
    plan = models.ForeignKey(EstateDepositPlan, related_name="installments", on_delete=models.CASCADE)
    milestone = models.CharField(max_length=500)
    amount_text = models.CharField(max_length=1000)
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)

    class Meta(EstateOrderedModel.Meta):
        constraints = [models.UniqueConstraint(fields=["plan", "source_key"], condition=~models.Q(source_key=""), name="uniq_estate_installment_source")]


class EstateIncentive(EstateOrderedModel):
    project = models.ForeignKey(EstateProject, related_name="incentives", on_delete=models.CASCADE)
    description = models.TextField()

    class Meta(EstateOrderedModel.Meta):
        constraints = [models.UniqueConstraint(fields=["project", "source_key"], condition=~models.Q(source_key=""), name="uniq_estate_incentive_source")]


class EstateAmenity(EstateOrderedModel):
    project = models.ForeignKey(EstateProject, related_name="amenities", on_delete=models.CASCADE)
    description = models.TextField()
    travel_time_minutes = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta(EstateOrderedModel.Meta):
        constraints = [models.UniqueConstraint(fields=["project", "source_key"], condition=~models.Q(source_key=""), name="uniq_estate_amenity_source")]


class EstateDocument(EstateOrderedModel):
    TYPE_CHOICES = [("floor_plan", "Floor plan"), ("brochure", "Brochure"), ("price_list", "Price list"), ("other", "Other")]
    project = models.ForeignKey(EstateProject, related_name="documents", on_delete=models.CASCADE)
    label = models.CharField(max_length=500)
    document_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default="other")
    source_url = models.URLField(max_length=3000)
    requires_phone_verification = models.BooleanField(default=True)

    class Meta(EstateOrderedModel.Meta):
        constraints = [models.UniqueConstraint(fields=["project", "source_key"], condition=~models.Q(source_key=""), name="uniq_estate_document_source")]


class EstateSourceSnapshot(models.Model):
    project = models.OneToOneField(EstateProject, related_name="source_snapshot", on_delete=models.CASCADE)
    raw_html = models.TextField(blank=True)
    raw_metadata = models.JSONField(default=dict, blank=True)
    raw_terms = models.JSONField(default=dict, blank=True)
    raw_post = models.JSONField(default=dict, blank=True)
    warnings = models.JSONField(default=list, blank=True)
    imported_project_values = models.JSONField(default=dict, blank=True)
    parser_version = models.PositiveSmallIntegerField(default=0)
    source_updated_at = models.DateTimeField(null=True, blank=True)
    imported_at = models.DateTimeField(auto_now=True)


class EstateDocumentIntent(models.Model):
    document = models.ForeignKey(EstateDocument, related_name="intents", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="estate_document_intents", on_delete=models.CASCADE)
    phone = models.CharField(max_length=30, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "document", "-created_at"])]
