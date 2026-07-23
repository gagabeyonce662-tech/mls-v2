from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from .views import *
from .views_estate import (
    EstatePropertyCloudinaryAssetsAPIView,
    EstatePropertyButtonClickAPIView,
    EstatePropertyDetailAPIView,
    EstatePropertyListCreateAPIView,
    EstatePropertyMediaUploadAPIView,
    EstatePropertySchemaAPIView,
)
from .views_properties import PropertyFilterView
from .views_valuation import (
    ValuationAutocompleteAPIView,
    ValuationLookupAPIView,
    ValuationEstimateAPIView,
)
from .views_estate_projects import (
    EstateDocumentAccessAPIView,
    EstateDocumentIntentAPIView,
    EstateDocumentProxyAPIView,
    EstateProjectDetailAPIView, EstateProjectListAPIView,
)
from .views_precon import (
    PreComPropertyBulkUploadAPIView,
    PreComPropertyDetailAPIView,
    PreComFloorPlanIntentAPIView,
    PreComPropertyRecommendationsAPIView,
    PreComPropertyListAPIView,
)

urlpatterns = [
    path('estate-projects/', EstateProjectListAPIView.as_view(), name='estate-project-list'),
    path('estate-projects/<str:lookup>/', EstateProjectDetailAPIView.as_view(), name='estate-project-detail'),
    path('estate-documents/<int:document_id>/intent/', EstateDocumentIntentAPIView.as_view(), name='estate-document-intent'),
    path('estate-documents/<int:document_id>/access/', EstateDocumentAccessAPIView.as_view(), name='estate-document-access'),
    path('estate-documents/proxy/', EstateDocumentProxyAPIView.as_view(), name='estate-document-proxy'),
    path('valuation/autocomplete/', ValuationAutocompleteAPIView.as_view(), name='valuation-autocomplete'),
    path('valuation/lookup/', ValuationLookupAPIView.as_view(), name='valuation-lookup'),
    path('valuation/estimate/', ValuationEstimateAPIView.as_view(), name='valuation-estimate'),
    path('inquiries/', PropertyInquiryAPIView.as_view(), name='property-inquiries'),
    path('feedback/', FeedbackAPIView.as_view(), name='feedback'),
    path('watched/', WatchedOverviewAPIView.as_view(), name='watched-overview'),
    path('watched/favorites/toggle/', WatchedFavoriteToggleAPIView.as_view(), name='watched-favorite-toggle'),
    path('watched/history/add/', WatchedHistoryAddAPIView.as_view(), name='watched-history-add'),
    path('watched/toured/toggle/', WatchedTouredToggleAPIView.as_view(), name='watched-toured-toggle'),
    path('watched/areas/follow/', WatchedAreaFollowAPIView.as_view(), name='watched-area-follow'),
    path('watched/areas/unfollow/', WatchedAreaUnfollowAPIView.as_view(), name='watched-area-unfollow'),
    path('watched/alerts/preferences/', WatchedAlertPreferencesAPIView.as_view(), name='watched-alert-preferences'),
    path('watched/alerts/preview/', WatchedAlertPreviewAPIView.as_view(), name='watched-alert-preview'),
    path('watched/favorites/clear/', WatchedClearFavoritesAPIView.as_view(), name='watched-favorites-clear'),
    path('watched/history/clear/', WatchedClearHistoryAPIView.as_view(), name='watched-history-clear'),
    path('watched/toured/clear/', WatchedClearTouredAPIView.as_view(), name='watched-toured-clear'),
    path('watched/areas/clear/', WatchedAreaClearAPIView.as_view(), name='watched-areas-clear'),
    path('properties/map-aggregates/', MapAggregatesAPIView.as_view(), name='map-aggregates'),
    path('locations/geocode/', MapGeocodingAPIView.as_view(), name='map-geocoding'),
    path('properties/property-types/', PropertyTypesAPIView.as_view(), name='property-types'),
    path('properties/exclusive-properties/', ExclusivePropertiesAPIView.as_view(), name='exclusive_properties'),
    path('properties/newly-listed-properties/', NewlyListedPropertiesAPIView.as_view(), name='exclusive_properties'),
    path('properties/community-properties/', CommunityPropertiesAPIView.as_view(), name='community-properties'),
    path('properties/pre-conn-properties/', PreConnPropertiesAPIView.as_view(), name='pre-conn-properties'),
    path('properties/upload-pre-conn/', UploadPreConnListingsAPIView.as_view(), name='upload-pre-conn'),
    path('precon-properties/', PreComPropertyListAPIView.as_view(), name='precon-property-list'),
    path('precon-properties/bulk-upload/', PreComPropertyBulkUploadAPIView.as_view(), name='precon-property-bulk-upload'),
    path('precon-properties/<int:pk>/floor-plan-intent/', PreComFloorPlanIntentAPIView.as_view(), name='precon-floor-plan-intent'),
    path('precon-properties/<int:pk>/recommendations/', PreComPropertyRecommendationsAPIView.as_view(), name='precon-property-recommendations'),
    path('precon-properties/<int:pk>/', PreComPropertyDetailAPIView.as_view(), name='precon-property-detail'),
    path('properties/', FetchProperties.as_view(), name='fetch_properties'),
    path('properties/filter/', PropertyFilterView.as_view(), name='property_filter'),
    path('properties/<str:listing_key>/recommendations/', PropertyRecommendationsAPIView.as_view(), name='property-recommendations'),
    path('properties/recommendations/track/', RecommendationTrackAPIView.as_view(), name='property-recommendations-track'),
    path('properties/ai-summary/', ListingAISummaryAPIView.as_view(), name='listing-ai-summary'),
    path('properties/lease-properties/', LeasePropertiesAPIView.as_view(), name='lease-properties'),
    # Keep backward compatibility for the original typo route while exposing the correct one.
    path('properties/compare/', PropertyCompareDetailView.as_view(), name='property_detail_compare'),
    path('properties/comapare/', PropertyCompareDetailView.as_view(), name='property_detail_compare'),
    path('nearest-school/', NearestSchoolAPIView.as_view(), name='nearest-school'),
    path('nearby-amenities/', NearbyAmenitiesAPIView.as_view(), name='nearby-amenities'),
    path('listing-sync-status/', ListingSyncStatusAPIView.as_view(), name='listing-sync-status'),
    path('catalog-stats/', ListingCatalogStatsAPIView.as_view(), name='catalog-stats'),
    path('trends/', ListingTrendsAPIView.as_view(), name='listing-trends'),
    path('listing-views/', ListingViewBeaconAPIView.as_view(), name='listing-view-beacon'),
    path('listing-engagement/', ListingEngagementAPIView.as_view(), name='listing-engagement'),
    path('census/fsa/<str:fsa>/', CensusFSAAPIView.as_view(), name='census-fsa'),
    path('properties/<str:listing_key>/snapshots/', PropertySnapshotsAPIView.as_view(), name='property-snapshots'),
    path('property-notes/', PropertyNoteAPIView.as_view(), name='property-notes'),
    path('properties/<str:PropertyKey>/', PropertyDetailView.as_view(), name='property_detail_path'),
    path('estate-properties/schema/', EstatePropertySchemaAPIView.as_view(), name='estate-property-schema'),
    path('estate-properties/media-upload/', EstatePropertyMediaUploadAPIView.as_view(), name='estate-property-media-upload'),
    path('estate-properties/cloudinary-assets/', EstatePropertyCloudinaryAssetsAPIView.as_view(), name='estate-property-cloudinary-assets'),
    path('estate-properties/buttons/click/', EstatePropertyButtonClickAPIView.as_view(), name='estate-property-button-click'),
    path('estate-properties/<int:pk>/', EstatePropertyDetailAPIView.as_view(), name='estate-property-detail'),
    path('estate-properties/', EstatePropertyListCreateAPIView.as_view(), name='estate-property-list'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
