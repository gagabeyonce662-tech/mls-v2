from django.conf import settings
from django.conf.urls.static import static
from django.urls import path,include
from .views import *

urlpatterns = [
    path('inquiries/', PropertyInquiryAPIView.as_view(), name='property-inquiries'),
    path('feedback/', FeedbackAPIView.as_view(), name='feedback'),
    path('watched/', WatchedOverviewAPIView.as_view(), name='watched-overview'),
    path('watched/favorites/toggle/', WatchedFavoriteToggleAPIView.as_view(), name='watched-favorite-toggle'),
    path('watched/history/add/', WatchedHistoryAddAPIView.as_view(), name='watched-history-add'),
    path('watched/favorites/clear/', WatchedClearFavoritesAPIView.as_view(), name='watched-favorites-clear'),
    path('watched/history/clear/', WatchedClearHistoryAPIView.as_view(), name='watched-history-clear'),
    path('properties/map-aggregates/', MapAggregatesAPIView.as_view(), name='map-aggregates'),
    path('properties/property-types/', PropertyTypesAPIView.as_view(), name='property-types'),
    path('properties/exclusive-properties/', ExclusivePropertiesAPIView.as_view(), name='exclusive_properties'),
    path('properties/newly-listed-properties/', NewlyListedPropertiesAPIView.as_view(), name='exclusive_properties'),
    path('properties/pre-conn-properties/', PreConnPropertiesAPIView.as_view(), name='pre-conn-properties'),
    path('properties/upload-pre-conn/', UploadPreConnListingsAPIView.as_view(), name='upload-pre-conn'),
    path('properties/', FetchProperties.as_view(), name='fetch_properties'),
    path('properties/filter/', PropertyFilterView.as_view(), name='property_filter'),
    path('properties/ai-summary/', ListingAISummaryAPIView.as_view(), name='listing-ai-summary'),
    path('properties/lease-properties/', LeasePropertiesAPIView.as_view(), name='lease-properties'),
    # Keep backward compatibility for the original typo route while exposing the correct one.
    path('properties/compare/', PropertyCompareDetailView.as_view(), name='property_detail_compare'),
    path('properties/comapare/', PropertyCompareDetailView.as_view(), name='property_detail_compare'),
    path('nearest-school/', NearestSchoolAPIView.as_view(), name='nearest-school'),
    path('catalog-stats/', ListingCatalogStatsAPIView.as_view(), name='catalog-stats'),
    path('listing-views/', ListingViewBeaconAPIView.as_view(), name='listing-view-beacon'),
    path('listing-engagement/', ListingEngagementAPIView.as_view(), name='listing-engagement'),
    path('census/fsa/<str:fsa>/', CensusFSAAPIView.as_view(), name='census-fsa'),
    path('properties/<str:listing_key>/snapshots/', PropertySnapshotsAPIView.as_view(), name='property-snapshots'),
    path('property-notes/', PropertyNoteAPIView.as_view(), name='property-notes'),
    path('properties/<str:PropertyKey>/', PropertyDetailView.as_view(), name='property_detail_path'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)