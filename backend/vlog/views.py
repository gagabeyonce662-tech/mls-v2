import uuid
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import generics, serializers, status
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import VlogPost, VlogCategory
from .permissions import CanAuthorPosts, CanAuthorPostsOrReadOnly
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

    Studio users (staff or `can_author`) see and manage every post. The team is
    small and trusted, and a shared editorial queue is what the client asked for
    — so posts are deliberately NOT scoped per author.
    """

    permission_classes = [CanAuthorPosts]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = VlogPost.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return VlogPostWriteSerializer
        return VlogPostSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class VlogPostManageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PUT / PATCH / DELETE /api/vlog/manage/<slug>/  (Studio users)."""

    permission_classes = [CanAuthorPosts]
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
    POST /api/vlog/categories/   create a category (Studio users).
    """

    queryset = VlogCategory.objects.all().order_by("name")
    serializer_class = VlogCategorySerializer
    permission_classes = [CanAuthorPostsOrReadOnly]


class VlogCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET is public; PUT / PATCH / DELETE are admin-only."""

    queryset = VlogCategory.objects.all()
    serializer_class = VlogCategorySerializer
    lookup_field = "slug"
    permission_classes = [CanAuthorPostsOrReadOnly]


# -----------------------------------------------------------------------------
# Studio image uploads.
# -----------------------------------------------------------------------------


class VlogImageUploadView(APIView):
    """POST /api/vlog/uploads/ — store one editor image, return its URL.

    django-ckeditor ships its own uploader, but it authenticates with a Django
    *session cookie* while the Studio uses a JWT bearer token, so its endpoint
    cannot be reached from our editor. This is the JWT-authenticated equivalent.

    Uploads are re-encoded with Pillow rather than stored as received. That
    normalises the bytes to a known-good image and drops EXIF and any trailing
    payload smuggled into a file that merely *starts* with image magic bytes.
    """

    permission_classes = [CanAuthorPosts]
    parser_classes = [MultiPartParser, FormParser]

    MAX_BYTES = 5 * 1024 * 1024
    # Pillow format -> (extension, save kwargs)
    ALLOWED_FORMATS = {
        "JPEG": (".jpg", {"quality": 85, "optimize": True}),
        "PNG": (".png", {"optimize": True}),
        "WEBP": (".webp", {"quality": 85}),
        "GIF": (".gif", {}),
    }

    @extend_schema(
        summary="Upload an image for use inside a post body",
        request={"multipart/form-data": {"type": "object", "properties": {
            "file": {"type": "string", "format": "binary"},
        }}},
        responses={
            201: OpenApiResponse(response=inline_serializer(
                name="VlogUploadResponse",
                fields={
                    "url": serializers.CharField(),
                    "width": serializers.IntegerField(),
                    "height": serializers.IntegerField(),
                },
            )),
            400: OpenApiResponse(description="Missing, oversized or unreadable image."),
        },
    )
    def post(self, request):
        upload = request.FILES.get("file") or request.FILES.get("upload")
        if upload is None:
            return Response(
                {"error": "No file was uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.size > self.MAX_BYTES:
            return Response(
                {"error": "Images must be 5 MB or smaller."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from PIL import Image
        except ImportError:  # pragma: no cover - Pillow is in requirements
            return Response(
                {"error": "Image processing is unavailable on the server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            image = Image.open(upload)
            image.load()
        except Exception:
            return Response(
                {"error": "That file could not be read as an image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image_format = (image.format or "").upper()
        if image_format not in self.ALLOWED_FORMATS:
            return Response(
                {"error": "Use a JPEG, PNG, WebP or GIF image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        extension, save_kwargs = self.ALLOWED_FORMATS[image_format]

        # Animated GIFs lose their frames on re-encode, so pass them through
        # after the decode check rather than flattening them to a still.
        if image_format == "GIF" and getattr(image, "is_animated", False):
            upload.seek(0)
            payload = ContentFile(upload.read())
        else:
            if image_format == "JPEG" and image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            buffer = BytesIO()
            image.save(buffer, format=image_format, **save_kwargs)
            payload = ContentFile(buffer.getvalue())

        name = f"vlog/uploads/{uuid.uuid4().hex}{extension}"
        stored_path = default_storage.save(name, payload)
        url = default_storage.url(stored_path)

        return Response(
            {"url": url, "width": image.width, "height": image.height},
            status=status.HTTP_201_CREATED,
        )
