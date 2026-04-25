from django.conf import settings
from django.conf.urls.static import static
from django.urls import path,include
from .views import *

urlpatterns = [
    path('properties/map-aggregates/', MapAggregatesAPIView.as_view(), name='map-aggregates'),
    path('properties/exclusive-properties/', ExclusivePropertiesAPIView.as_view(), name='exclusive_properties'),
    path('properties/newly-listed-properties/', NewlyListedPropertiesAPIView.as_view(), name='exclusive_properties'),
    path('properties/pre-conn-properties/', PreConnPropertiesAPIView.as_view(), name='pre-conn-properties'),
    path('properties/upload-pre-conn/', UploadPreConnListingsAPIView.as_view(), name='upload-pre-conn'),
    path('properties/', FetchProperties.as_view(), name='fetch_properties'),
    path('properties/filter/', PropertyFilterView.as_view(), name='property_filter'),
    path('properties/lease-properties/', LeasePropertiesAPIView.as_view(), name='lease-properties'),
    path('properties/comapare/', PropertyCompareDetailView.as_view(), name='property_detail_compare'),
    path('nearest-school/', NearestSchoolAPIView.as_view(), name='nearest-school'),
    path('properties/<str:PropertyKey>/', PropertyDetailView.as_view(), name='property_detail_path'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)