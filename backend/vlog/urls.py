from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from .views import (
    VlogCategoryDetailView,
    VlogCategoryListCreateView,
    VlogImageUploadView,
    VlogPostDetailView,
    VlogPostListView,
    VlogPostManageDetailView,
    VlogPostManageListCreateView,
)
from .views_team import StudioTeamMemberView, StudioTeamView

urlpatterns = [
    # Authenticated CRUD - must come before the public <slug> catch-all.
    path('manage/', VlogPostManageListCreateView.as_view(), name='vlog-manage-list'),
    path('uploads/', VlogImageUploadView.as_view(), name='vlog-upload'),
    path('team/', StudioTeamView.as_view(), name='vlog-team'),
    path('team/<int:user_id>/', StudioTeamMemberView.as_view(), name='vlog-team-member'),
    path('manage/<slug:slug>/', VlogPostManageDetailView.as_view(), name='vlog-manage-detail'),
    path('categories/', VlogCategoryListCreateView.as_view(), name='vlog-category-list'),
    path('categories/<slug:slug>/', VlogCategoryDetailView.as_view(), name='vlog-category-detail'),

    # Public read-only surface (unchanged).
    path('', VlogPostListView.as_view(), name='vlog-list'),
    path('<slug:slug>/', VlogPostDetailView.as_view(), name='vlog-detail'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
