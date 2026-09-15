from django.db.models import Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import VlogPost, VlogCategory
from .serializers import (
    VlogCategorySerializer,
    VlogPostSerializer,
    VlogPostWriteSerializer,
)


def published_posts():
    """Return posts that are ready for public display."""
    return VlogPost.objects.filter(status=VlogPost.PUBLISHED).filter(
        Q(publish_date__isnull=True) | Q(publish_date__lte=timezone.now())
    )


# -----------------------------------------------------------------------------
# Public read endpoints (unchanged surface).
# -----------------------------------------------------------------------------


class VlogPostListView(generics.ListAPIView):
    """GET /api/vlog/ - list published posts."""

    queryset = VlogPost.objects.none()
    serializer_class = VlogPostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return published_posts()


class VlogPostDetailView(generics.RetrieveAPIView):
    """GET /api/vlog/<slug>/ - fetch a single published post."""

    queryset = VlogPost.objects.none()
    serializer_class = VlogPostSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]

    def get_queryset(self):
        return published_posts()


# -----------------------------------------------------------------------------
# CRUD endpoints for VlogPost (authenticated).
# -----------------------------------------------------------------------------


class VlogPostManageListCreateView(generics.ListCreateAPIView):
    """GET  /api/vlog/manage/       list all posts (drafts included)
    POST /api/vlog/manage/       create a new post.

    Admin-only. Staff users see and manage every post.
    """

    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = VlogPost.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return VlogPostWriteSerializer
        return VlogPostSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class VlogPostManageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PUT / PATCH / DELETE /api/vlog/manage/<slug>/  (admin-only)."""

    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    lookup_field = "slug"
    queryset = VlogPost.objects.all()

    def get_serializer_class(self):
        if self.request.method in {"PUT", "PATCH"}:
            return VlogPostWriteSerializer
        return VlogPostSerializer


# -----------------------------------------------------------------------------
# CRUD endpoints for VlogCategory.
# -----------------------------------------------------------------------------


class VlogCategoryListCreateView(generics.ListCreateAPIView):
    """GET  /api/vlog/categories/   list categories (public)
    POST /api/vlog/categories/   create a category (admin-only).
    """

    queryset = VlogCategory.objects.all().order_by("name")
    serializer_class = VlogCategorySerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [AllowAny()]


class VlogCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET is public; PUT / PATCH / DELETE are admin-only."""

    queryset = VlogCategory.objects.all()
    serializer_class = VlogCategorySerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]
