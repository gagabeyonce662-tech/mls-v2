
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path,include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from .health import HealthView, ReadinessView
SPECTACULAR_SETTINGS = {
    "TITLE": "VSell4U MLS API",
    "DESCRIPTION": (
        "API documentation for listings, property search, inquiries, "
        "user accounts, watched properties, and related MLS services."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SERVE_AUTHENTICATION": [
        "rest_framework_simplejwt.authentication.JWTAuthentication"
    ],
    "COMPONENT_SPLIT_REQUEST": True,

    "TAGS": [
        {
            "name": "Health",
            "description": (
                "Application liveness and database readiness checks."
            ),
        },
    ],
}
urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('health/ready/', ReadinessView.as_view(), name='health-ready'),
    path('admin/', admin.site.urls),
    path('ckeditor/', include('ckeditor_uploader.urls')), 
    path('api/vlog/',include('vlog.urls')),
    path('api/mls/',include('mls.urls')),
    path('api/auth/', include('accounts.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
