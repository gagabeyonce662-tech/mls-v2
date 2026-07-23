# admin.py
import uuid

from django.contrib import admin
from django import forms
from django.utils.html import format_html
from .models import (
    Attachment,
    Author,
    Content,
    ContentMeta,
    EstateProject,
    EstateProperty,
    EstatePropertyImage,
    Media,
    PreComFloorPlanIntent,
    PreComProperty,
    Property,
    PropertyInquiry,
    Room,
    Taxonomy,
    UserFeedback,
    EstateAmenity,
    EstateDepositInstallment,
    EstateDepositPlan,
    EstateDocument,
    EstateIncentive,
    EstatePrice,
    EstateProject,
    EstateUnitType,
)
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



admin.site.register(Room, RoomAdmin)
admin.site.register(Media, MediaAdmin)
admin.site.register(UserFeedback, UserFeedbackAdmin)


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("wp_id", "login", "display_name", "email")
    search_fields = ("login", "display_name", "email", "first_name", "last_name")
    ordering = ("display_name",)


@admin.register(Taxonomy)
class TaxonomyAdmin(admin.ModelAdmin):
    list_display = ("wp_id", "taxonomy", "name", "slug", "parent")
    list_filter = ("taxonomy",)
    search_fields = ("name", "slug")
    ordering = ("taxonomy", "name")


class ContentMetaInline(admin.TabularInline):
    model = ContentMeta
    extra = 0
    classes = ("collapse",)


class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0
    classes = ("collapse",)


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ("wp_id", "content_type", "title", "slug", "status", "published_at", "author")
    list_filter = ("content_type", "status")
    search_fields = ("title", "slug", "wp_id")
    autocomplete_fields = ("author",)
    filter_horizontal = ("taxonomies",)
    inlines = [ContentMetaInline, AttachmentInline]
    ordering = ("-published_at", "-id")


@admin.register(ContentMeta)
class ContentMetaAdmin(admin.ModelAdmin):
    list_display = ("content", "key", "value")
    search_fields = ("key", "value")


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("content", "url", "mime_type", "title")
    search_fields = ("url", "title", "mime_type")


@admin.register(PreComProperty)
class PreComPropertyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "content",
        "price",
        "bedrooms",
        "bathrooms",
        "area",
        "latitude",
        "longitude",
    )
    search_fields = ("content__title", "content__slug", "content__wp_id", "address")
    autocomplete_fields = ("content",)
    ordering = ("-id",)


@admin.register(PreComFloorPlanIntent)
class PreComFloorPlanIntentAdmin(admin.ModelAdmin):
    """Read-only agent view of high-intent floor-plan requests."""

    list_display = ("created_at", "project", "user", "phone", "source_url")
    list_filter = ("created_at",)
    search_fields = (
        "property__content__title",
        "property__content__slug",
        "user__email",
        "user__name",
        "user__phone",
    )
    list_select_related = ("property__content", "user")
    readonly_fields = ("property", "user", "source_url", "created_at")
    ordering = ("-created_at",)

    @admin.display(description="Project", ordering="property__content__title")
    def project(self, obj):
        return obj.property.content.title

    @admin.display(description="Phone", ordering="user__phone")
    def phone(self, obj):
        return obj.user.phone or "—"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.method in ("GET", "HEAD")




@admin.register(EstateProperty)
class EstatePropertyAdmin(admin.ModelAdmin):
    list_display = (
        "listing_key",
        "property_title",
        "publish_status",
        "city",
        "list_price",
        "is_featured",
    )

    list_filter = (
        "publish_status",
        "is_featured",
        "city",
        "standard_status",
    )

    search_fields = (
        "listing_key",
        "listing_id",
        "property_title",
        "property_slug",
        "city",
        "unparsed_address",
    )

    readonly_fields = (
        "id",
        "listing_key",
        "modification_timestamp",
    )

    ordering = (
        "-modification_timestamp",
    )


class EstateUnitTypeInline(admin.TabularInline):
    model = EstateUnitType
    extra = 0
    fields = (
        "name",
        "description",
        "display_order",
    )


class EstatePriceInline(admin.TabularInline):
    model = EstatePrice
    extra = 0
    fields = (
        "unit_type",
        "display_text",
        "amount",
        "currency",
        "display_order",
    )


class EstateIncentiveInline(admin.TabularInline):
    model = EstateIncentive
    extra = 0
    fields = (
        "description",
        "display_order",
    )


class EstateAmenityInline(admin.TabularInline):
    model = EstateAmenity
    extra = 0
    fields = (
        "description",
        "display_order",
    )


class EstateDocumentInline(admin.TabularInline):
    model = EstateDocument
    extra = 0
    fields = (
        "label",
        "document_type",
        "source_url",
        "requires_phone_verification",
        "display_order",
    )
    

@admin.register(EstateProject)
class EstateProjectAdmin(admin.ModelAdmin):

    inlines = (
        EstateUnitTypeInline,
        EstatePriceInline,
        EstateIncentiveInline,
        EstateAmenityInline,
        EstateDocumentInline,
    )

    list_display = (
        "title",
        "developer",
        "city",
        "publication_status",
        "occupancy_year",
        "is_featured",
    )

    list_filter = (
        "publication_status",
        "is_featured",
        "province",
        "city",
    )

    search_fields = (
        "title",
        "developer",
        "address",
        "city",
        "source_id",
    )

    readonly_fields = (
        "source",
        "source_id",
        "source_updated_at",
        "created_at",
        "updated_at",
    )

    prepopulated_fields = {
        "slug": ("title",),
    }

    ordering = (
        "-is_featured",
        "title",
    )


class EstateDepositInstallmentInline(admin.TabularInline):
    model = EstateDepositInstallment
    extra = 0
    fields = (
        "milestone",
        "amount_text",
        "amount",
        "percentage",
        "display_order",
    )


@admin.register(EstateDepositPlan)
class EstateDepositPlanAdmin(admin.ModelAdmin):
    inlines = (
        EstateDepositInstallmentInline,
    )

    list_display = (
        "title",
        "project",
        "unit_type",
        "display_order",
    )
    list_filter = (
        "project",
    )
    search_fields = (
        "title",
        "project__title",
    )
