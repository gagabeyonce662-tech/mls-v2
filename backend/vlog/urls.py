from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from .views import (
    VlogCategoryDetailView,
    VlogCategoryListCreateView,
    VlogPostDetailView,
    VlogPostListView,
    VlogPostManageDetailView,
    VlogPostManageListCreateView,
)

urlpatterns = [
    # Authenticated CRUD - must come before the public <slug> catch-all.
    path('manage/', VlogPostManageListCreateView.as_view(), name='vlog-manage-list'),
    path('manage/<slug:slug>/', VlogPostManageDetailView.as_view(), name='vlog-manage-detail'),
    path('categories/', VlogCategoryListCreateView.as_view(), name='vlog-category-list'),
    path('categories/<slug:slug>/', VlogCategoryDetailView.as_view(), name='vlog-category-detail'),

    # Public read-only surface (unchanged).
    path('', VlogPostListView.as_view(), name='vlog-list'),
    path('<slug:slug>/', VlogPostDetailView.as_view(), name='vlog-detail'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
