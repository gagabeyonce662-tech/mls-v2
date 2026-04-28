# admin.py
from django.contrib import admin
from .models import Property, Room, Media, UserFeedback, PropertyInquiry

class RoomInline(admin.TabularInline):
    model = Room
    extra = 1

class MediaInline(admin.TabularInline):
    model = Media
    extra = 1

class PropertyAdmin(admin.ModelAdmin):
    list_display = ('listing_key','category_type','is_featured','list_price', 'property_sub_type', 'city', 'state_or_province')
    list_filter = ('category_type', 'is_featured', 'city', 'state_or_province')
    list_editable = ('is_featured',)
    search_fields = ('listing_key', 'city', 'street_name', 'public_remarks')
    inlines = [RoomInline, MediaInline]
    ordering = ('-is_featured', 'listing_key')
    actions = ('delete_selected_properties',)

    @admin.action(description="Delete selected properties", permissions=["delete"])
    def delete_selected_properties(self, request, queryset):
        deleted_count, _ = queryset.delete()
        self.message_user(request, f"Deleted {deleted_count} property records.")

class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_type', 'room_length', 'room_width', 'room_level')
    search_fields = ('room_type',)

class MediaAdmin(admin.ModelAdmin):
    list_display = ('media_url', 'media_category', 'order', 'is_preferred')
    search_fields = ('media_category',)

class UserFeedbackAdmin(admin.ModelAdmin):
    list_display = ("feedback_type", "status", "email", "created_at")
    list_filter = ("feedback_type", "status", "created_at")
    search_fields = ("name", "email", "message", "page_url")
    readonly_fields = ("created_at",)


@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(admin.ModelAdmin):
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
