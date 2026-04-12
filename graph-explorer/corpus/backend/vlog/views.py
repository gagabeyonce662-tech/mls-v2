from rest_framework import generics
from .models import VlogPost
from .serializers import VlogPostSerializer

class VlogPostListView(generics.ListAPIView):
    queryset = VlogPost.objects.all()
    serializer_class = VlogPostSerializer

class VlogPostDetailView(generics.RetrieveAPIView):
    queryset = VlogPost.objects.all()
    serializer_class = VlogPostSerializer
    lookup_field = 'slug'  # We use 'slug' for the lookup instead of pk
