
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
