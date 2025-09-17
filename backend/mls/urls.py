from django.conf import settings
from django.conf.urls.static import static
from django.urls import path,include
from .views import *

urlpatterns = [
    path('properties/', FetchProperties.as_view(), name='fetch_properties'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)