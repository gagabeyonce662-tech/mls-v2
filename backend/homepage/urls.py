from django.urls import path

from . import integration_views, site_views, studio_editorial, views

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
    # Published site documents (admin console). Anonymous read.
    path("content/<str:key>/", site_views.PublicSiteContentView.as_view(), name="site-content"),
    # Staff console.
    path("studio/content/<str:key>/", site_views.StudioSiteContentView.as_view(), name="studio-site-content"),
    path("studio/content/<str:key>/publish/", site_views.StudioSitePublishView.as_view(), name="studio-site-publish"),
    path("studio/content/<str:key>/discard/", site_views.StudioSiteDiscardView.as_view(), name="studio-site-discard"),
    path("studio/content/<str:key>/revisions/", site_views.StudioSiteRevisionListView.as_view(), name="studio-site-revisions"),
    path("studio/content/<str:key>/restore/", site_views.StudioSiteRestoreView.as_view(), name="studio-site-restore"),
    path("studio/media/", site_views.StudioSiteMediaView.as_view(), name="studio-site-media"),
    path("integrations/public/", integration_views.PublicIntegrationsView.as_view(), name="integrations-public"),
    path("studio/integrations/", integration_views.StudioIntegrationsView.as_view(), name="studio-integrations"),
    path("studio/incentives/", studio_editorial.StudioIncentiveListView.as_view(), name="studio-incentives"),
    path("studio/incentives/<int:pk>/", studio_editorial.StudioIncentiveDetailView.as_view(), name="studio-incentive"),
    path("studio/partners/", studio_editorial.StudioPartnerListView.as_view(), name="studio-partners"),
    path("studio/partners/<int:pk>/", studio_editorial.StudioPartnerDetailView.as_view(), name="studio-partner"),
    path("studio/community-images/", studio_editorial.StudioCommunityImageListView.as_view(), name="studio-community-images"),
    path("studio/community-images/<str:city_key>/", studio_editorial.StudioCommunityImageDetailView.as_view(), name="studio-community-image"),
    path("studio/news/", studio_editorial.StudioNewsListView.as_view(), name="studio-news"),
    path("studio/news/<int:pk>/", studio_editorial.StudioNewsDetailView.as_view(), name="studio-news-item"),
]
