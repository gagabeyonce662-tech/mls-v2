from django.db import models
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

    def __str__(self):
        return f"Property {self.listing_key} - {self.city}"

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