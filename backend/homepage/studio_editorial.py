"""Staff CRUD for homepage lists that already live in Django admin."""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from vlog.permissions import IsStaffUser

from .models import BuyerIncentive, CommunityImage, NewsArticle, NewsSource, Partner
from .serializers import (
    BuyerIncentiveSerializer,
    CommunityImageSerializer,
    NewsArticleSerializer,
    PartnerSerializer,
)


def _resolve_news_source(name: str) -> NewsSource:
    """Find or create a feed row for a hand-entered source label."""
    label = (name or "HomeAtlas").strip()[:120] or "HomeAtlas"
    existing = NewsSource.objects.filter(name=label).first()
    if existing:
        return existing
    base = slugify(label) or "editorial"
    feed_url = f"manual://{base}"
    suffix = 0
    while NewsSource.objects.filter(feed_url=feed_url).exists():
        suffix += 1
        feed_url = f"manual://{base}-{suffix}"
    return NewsSource.objects.create(
        name=label,
        feed_url=feed_url,
        tag="Editorial",
        is_active=False,
    )


class _Staff(APIView):
    permission_classes = [IsStaffUser]


class StudioIncentiveListView(_Staff):
    def get(self, request):
        rows = BuyerIncentive.objects.all()
        return Response({"results": BuyerIncentiveSerializer(rows, many=True).data})

    def post(self, request):
        serializer = BuyerIncentiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudioIncentiveDetailView(_Staff):
    def patch(self, request, pk: int):
        row = get_object_or_404(BuyerIncentive, pk=pk)
        serializer = BuyerIncentiveSerializer(row, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk: int):
        get_object_or_404(BuyerIncentive, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioPartnerListView(_Staff):
    def get(self, request):
        return Response({"results": PartnerSerializer(Partner.objects.all(), many=True).data})

    def post(self, request):
        serializer = PartnerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudioPartnerDetailView(_Staff):
    def patch(self, request, pk: int):
        row = get_object_or_404(Partner, pk=pk)
        serializer = PartnerSerializer(row, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk: int):
        get_object_or_404(Partner, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioCommunityImageListView(_Staff):
    def get(self, request):
        return Response({"results": CommunityImageSerializer(CommunityImage.objects.all(), many=True).data})

    def post(self, request):
        serializer = CommunityImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudioCommunityImageDetailView(_Staff):
    def patch(self, request, city_key: str):
        key = city_key.strip().lower()
        row = CommunityImage.objects.filter(city_key=key).first()
        payload = {**dict(request.data), "city_key": key}
        if row is None:
            # First save for a city that only had a frontend fallback photo.
            serializer = CommunityImageSerializer(data=payload)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        serializer = CommunityImageSerializer(row, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, city_key: str):
        get_object_or_404(CommunityImage, city_key=city_key.strip().lower()).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioNewsListView(_Staff):
    def get(self, request):
        rows = NewsArticle.objects.select_related("source")[:50]
        return Response({"results": NewsArticleSerializer(rows, many=True).data})

    def post(self, request):
        title = str(request.data.get("title") or "").strip()
        url = str(request.data.get("url") or "").strip()
        image_url = str(request.data.get("image_url") or "").strip()
        source_name = str(request.data.get("source") or "HomeAtlas").strip()
        is_hidden = bool(request.data.get("is_hidden"))
        if not title:
            return Response({"title": ["Enter a headline."]}, status=status.HTTP_400_BAD_REQUEST)
        if not url.startswith(("http://", "https://")):
            return Response({"url": ["Enter a full https link."]}, status=status.HTTP_400_BAD_REQUEST)
        if NewsArticle.objects.filter(url=url).exists():
            return Response({"url": ["That link is already in the list."]}, status=status.HTTP_400_BAD_REQUEST)
        row = NewsArticle.objects.create(
            source=_resolve_news_source(source_name),
            title=title[:300],
            url=url[:1000],
            image_url=image_url[:1000],
            tag="Editorial",
            published_at=timezone.now(),
            is_hidden=is_hidden,
        )
        return Response(NewsArticleSerializer(row).data, status=status.HTTP_201_CREATED)


class StudioNewsDetailView(_Staff):
    def patch(self, request, pk: int):
        row = get_object_or_404(NewsArticle.objects.select_related("source"), pk=pk)
        data = request.data
        update_fields: list[str] = []

        if "is_hidden" in data:
            hidden = data.get("is_hidden")
            if not isinstance(hidden, bool):
                return Response({"detail": "Set is_hidden to true or false."}, status=status.HTTP_400_BAD_REQUEST)
            row.is_hidden = hidden
            update_fields.append("is_hidden")

        if "title" in data:
            title = str(data.get("title") or "").strip()
            if not title:
                return Response({"title": ["Enter a headline."]}, status=status.HTTP_400_BAD_REQUEST)
            row.title = title[:300]
            update_fields.append("title")

        if "url" in data:
            url = str(data.get("url") or "").strip()
            if not url.startswith(("http://", "https://")):
                return Response({"url": ["Enter a full https link."]}, status=status.HTTP_400_BAD_REQUEST)
            if NewsArticle.objects.filter(url=url).exclude(pk=row.pk).exists():
                return Response({"url": ["That link is already in the list."]}, status=status.HTTP_400_BAD_REQUEST)
            row.url = url[:1000]
            update_fields.append("url")

        if "image_url" in data:
            row.image_url = str(data.get("image_url") or "").strip()[:1000]
            update_fields.append("image_url")

        if "source" in data:
            row.source = _resolve_news_source(str(data.get("source") or ""))
            update_fields.append("source")

        if not update_fields:
            return Response({"detail": "Nothing to update."}, status=status.HTTP_400_BAD_REQUEST)

        row.save(update_fields=update_fields)
        return Response(NewsArticleSerializer(row).data)
