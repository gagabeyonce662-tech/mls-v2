# admin.py
from django.contrib import admin
from .models import Property, Room, Media, UserFeedback, PropertyInquiry
from .admin_ui import SectionedAdminMixin

class RoomInline(admin.TabularInline):
    model = Room
    extra = 0
    show_change_link = True
    classes = ("collapse",)
    ordering = ("room_type",)
    fields = (
        "room_type",
        "room_level",
        "room_length",
        "room_width",
        "room_dimensions",
        "room_description",
        "room_length_width_units",
    )

class MediaInline(admin.TabularInline):
    model = Media
    extra = 0
    show_change_link = True
    classes = ("collapse",)
    ordering = ("order", "id")
    fields = (
        "order",
        "is_preferred",
        "media_category",
        "media_url",
        "media_file",
    )

class PropertyAdmin(SectionedAdminMixin, admin.ModelAdmin):
    change_list_template = "admin/mls/property_change_list.html"
    list_display = ('listing_key','category_type','is_featured','list_price', 'property_sub_type', 'city', 'state_or_province')
    list_filter = ('category_type', 'is_featured', 'city', 'state_or_province')
    list_editable = ('is_featured',)
    search_fields = ('listing_key', 'city', 'street_name', 'public_remarks')
    inlines = [RoomInline, MediaInline]
    fieldsets = (
        (
            "Listing Core",
            {
                "fields": (
                    "listing_key",
                    "listing_id",
                    "category_type",
                    "property_sub_type",
                    "standard_status",
                    "is_featured",
                    "is_manual",
                )
            },
        ),
        (
            "Pricing",
            {
                "fields": (
                    "list_price",
                    "lease_amount",
                    "lease_amount_frequency",
                    "price_per_unit",
                    "lease_per_unit",
                    "association_fee",
                    "tax_annual_amount",
                )
            },
        ),
        (
            "Location",
            {
                "fields": (
                    "country",
                    "state_or_province",
                    "city",
                    "postal_code",
                    "street_name",
                    "street_number",
                    "latitude",
                    "longitude",
                    "directions",
                )
            },
        ),
        (
            "Property Specs",
            {
                "fields": (
                    "bedrooms_total",
                    "bathrooms_total_integer",
                    "living_area",
                    "year_built",
                    "stories",
                    "parking_total",
                )
            },
        ),
        (
            "Interior Features",
            {
                "fields": (
                    "appliances",
                    "cooling",
                    "heating",
                    "flooring",
                    "basement",
                    "fireplace_features",
                )
            },
        ),
        (
            "Exterior Features",
            {
                "fields": (
                    "roof",
                    "construction_materials",
                    "exterior_features",
                    "pool_features",
                    "waterfront_features",
                )
            },
        ),
        (
            "Lot / Land",
            {
                "classes": ("collapse",),
                "fields": (
                    "lot_size_area",
                    "lot_size_dimensions",
                    "zoning",
                    "frontage_length_numeric",
                )
            },
        ),
        (
            "Commercial",
            {
                "classes": ("collapse",),
                "fields": (
                    "business_type",
                    "current_use",
                    "possible_use",
                    "anchors_co_tenants",
                )
            },
        ),
        (
            "Media & AI",
            {
                "classes": ("collapse",),
                "fields": (
                    "photos_count",
                    "listing_url",
                    "ai_summary_markdown",
                )
            },
        ),
        (
            "System / Sync Metadata",
            {
                "classes": ("collapse",),
                "fields": (
                    "origin_system_name",
                    "photos_change_timestamp",
                    "ai_summary_payload_hash",
                    "modification_timestamp",
                ),
            },
        ),
    )
    ordering = ('-is_featured', 'listing_key')
    actions = ('delete_selected_properties',)

    @admin.action(description="Delete selected properties", permissions=["delete"])
    def delete_selected_properties(self, request, queryset):
        deleted_count, _ = queryset.delete()
        self.message_user(request, f"Deleted {deleted_count} property records.")

class RoomAdmin(SectionedAdminMixin, admin.ModelAdmin):
    list_display = ('room_type', 'room_length', 'room_width', 'room_level')
    search_fields = ('room_type',)

class MediaAdmin(SectionedAdminMixin, admin.ModelAdmin):
    list_display = ('media_url', 'media_category', 'order', 'is_preferred')
    search_fields = ('media_category',)

class UserFeedbackAdmin(SectionedAdminMixin, admin.ModelAdmin):
    list_display = ("feedback_type", "status", "email", "created_at")
    list_filter = ("feedback_type", "status", "created_at")
    search_fields = ("name", "email", "message", "page_url")
    readonly_fields = ("created_at",)


@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(SectionedAdminMixin, admin.ModelAdmin):
    list_display = (
        "created_at",
        "first_name",
        "last_name",
        "email",
        "intent",
        "status",
        "ghl_synced_at",
        "email_sent_at",
    )
    list_filter = ("status", "intent", "created_at")
    list_editable = ("status",)
    search_fields = (
        "first_name",
        "last_name",
        "email",
        "phone",
        "message",
        "preferred_locations",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
        "ghl_contact_id",
        "ghl_synced_at",
        "email_sent_at",
        "last_error",
        "user",
    )
    fieldsets = (
        ("Contact", {"fields": ("user", "first_name", "last_name", "email", "phone")}),
        (
            "Inquiry",
            {
                "fields": (
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
                )
            },
        ),
        ("Workflow", {"fields": ("status",)}),
        (
            "Delivery",
            {
                "fields": (
                    "ghl_contact_id",
                    "ghl_synced_at",
                    "email_sent_at",
                    "last_error",
                )
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


admin.site.register(Property, PropertyAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(Media, MediaAdmin)
admin.site.register(UserFeedback, UserFeedbackAdmin)
