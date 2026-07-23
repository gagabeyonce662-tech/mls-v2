from django.db.models import Q
from django.utils import timezone
from rest_framework import generics
from .models import VlogPost
from .serializers import VlogPostSerializer


def published_posts():
    """Return posts that are ready for public display."""
    return VlogPost.objects.filter(status=VlogPost.PUBLISHED).filter(
        Q(publish_date__isnull=True) | Q(publish_date__lte=timezone.now())
    )

class VlogPostListView(generics.ListAPIView):
    queryset = VlogPost.objects.none()
    serializer_class = VlogPostSerializer

    def get_queryset(self):
        return published_posts()

class VlogPostDetailView(generics.RetrieveAPIView):
    queryset = VlogPost.objects.none()
    serializer_class = VlogPostSerializer
    lookup_field = 'slug'  # We use 'slug' for the lookup instead of pk

    def get_queryset(self):
        return published_posts()
