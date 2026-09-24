from django.contrib import admin

from .models import (
    BuyerIncentive,
    CommunityImage,
    MarketSnapshot,
    NearbyAlert,
    NewsArticle,
    NewsletterSubscriber,
    NewsSource,
    Partner,
    SoldBelowPurchase,
)


@admin.register(BuyerIncentive)
class BuyerIncentiveAdmin(admin.ModelAdmin):
    list_display = ("title", "amount_text", "label", "reviewed_at", "is_active", "display_order")
    list_editable = ("is_active", "display_order")
    list_filter = ("is_active",)
    search_fields = ("title", "description")


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active", "display_order")
    list_editable = ("is_active", "display_order")
    list_filter = ("category", "is_active")
    search_fields = ("name",)


@admin.register(CommunityImage)
class CommunityImageAdmin(admin.ModelAdmin):
    list_display = ("city_label", "city_key", "updated_at")
    search_fields = ("city_label", "city_key")


@admin.register(NewsSource)
class NewsSourceAdmin(admin.ModelAdmin):
    list_display = ("name", "feed_url", "tag", "is_active", "last_fetched_at", "last_error")
    list_filter = ("is_active",)
    readonly_fields = ("last_fetched_at", "last_error")


@admin.register(NewsArticle)
class NewsArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "published_at", "is_hidden")
    list_filter = ("source", "is_hidden")
    list_editable = ("is_hidden",)
    search_fields = ("title",)
    date_hierarchy = "published_at"


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    # Consent evidence is read-only: editing it would defeat its purpose.
    list_display = ("email", "source", "consent_at", "unsubscribed_at")
    list_filter = ("source",)
    search_fields = ("email",)
    readonly_fields = ("consent_at", "consent_text", "ip_address", "token", "created_at")


@admin.register(NearbyAlert)
class NearbyAlertAdmin(admin.ModelAdmin):
    list_display = ("email", "label", "radius_km", "is_active", "last_notified_at", "created_at")
    list_filter = ("is_active",)
    search_fields = ("email", "label")
    readonly_fields = ("consent_at", "consent_text", "token", "created_at")


@admin.register(SoldBelowPurchase)
class SoldBelowPurchaseAdmin(admin.ModelAdmin):
    list_display = ("address", "city", "close_price", "previous_close_price", "close_date")
    list_filter = ("city",)
    search_fields = ("address",)

    def has_add_permission(self, request):
        return False  # computed by refresh_homepage_feeds


@admin.register(MarketSnapshot)
class MarketSnapshotAdmin(admin.ModelAdmin):
    list_display = ("scope", "as_of")
    readonly_fields = ("scope", "payload", "as_of")

    def has_add_permission(self, request):
        return False  # computed by refresh_homepage_feeds
