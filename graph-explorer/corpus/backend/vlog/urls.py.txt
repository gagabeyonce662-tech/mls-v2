from django.conf import settings
from django.conf.urls.static import static
from django.urls import path,include
from .views import *

urlpatterns = [
    path('', VlogPostListView.as_view(), name='vlog-list'),
    path('<slug:slug>/', VlogPostDetailView.as_view(), name='vlog-detail'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)