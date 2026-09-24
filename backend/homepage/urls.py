from django.urls import path

from . import views

app_name = "homepage"

urlpatterns = [
    # Editorial content (admin-maintained)
    path("incentives/", views.BuyerIncentiveListView.as_view(), name="incentives"),
    path("partners/", views.PartnerListView.as_view(), name="partners"),
    path("community-images/", views.CommunityImageListView.as_view(), name="community-images"),
    path("news/", views.NewsListView.as_view(), name="news"),
    # Derived feeds
    path("investor-picks/", views.InvestorPicksView.as_view(), name="investor-picks"),
    path("deals/", views.MarketDealsView.as_view(), name="deals"),
    path("sold-below-purchase/", views.SoldBelowPurchaseView.as_view(), name="sold-below-purchase"),
    path("market-snapshot/", views.MarketSnapshotView.as_view(), name="market-snapshot"),
    path("nearby-activity/", views.NearbyActivityView.as_view(), name="nearby-activity"),
    # Subscriptions
    path("newsletter/subscribe/", views.NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
    path("nearby-alerts/", views.NearbyAlertListCreateView.as_view(), name="nearby-alerts"),
    path("nearby-alerts/<int:pk>/", views.NearbyAlertDetailView.as_view(), name="nearby-alert-detail"),
    path("unsubscribe/", views.UnsubscribeView.as_view(), name="unsubscribe"),
]
