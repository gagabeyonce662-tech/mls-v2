"""Lightweight listing-key feed for the frontend's XML sitemap.

The only other way to enumerate listings is paging `properties/filter/`, which
serializes full rows with per-row extra queries (~57s per 100 rows on the dev
DB). A sitemap needs two columns, so this reads exactly those with
`values_list` and pages by primary key order so page N is stable between the
count request and the page request.
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Property

SITEMAP_PAGE_SIZE = 10000


class SitemapListingKeysView(APIView):
    """GET /api/mls/properties/sitemap-keys/?page=N

    Returns ``{count, page, page_size, results: [{listing_key, modified}]}`` for
    Active listings only; sold/expired pages should drop out of the index.
    ``?count_only=1`` skips the rows — the frontend needs the count alone to
    decide how many child sitemaps to advertise.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            page = max(int(request.GET.get("page", 1)), 1)
        except (TypeError, ValueError):
            page = 1

        # Case-insensitive, matching how the listing views treat `status`.
        qs = (
            Property.objects.filter(standard_status__iexact="active")
            .exclude(listing_key="")
            .order_by("pk")
        )
        count = qs.count()
        if request.GET.get("count_only") in ("1", "true"):
            return Response(
                {"count": count, "page": page, "page_size": SITEMAP_PAGE_SIZE, "results": []}
            )
        start = (page - 1) * SITEMAP_PAGE_SIZE
        rows = qs.values_list("listing_key", "modification_timestamp")[
            start : start + SITEMAP_PAGE_SIZE
        ]

        return Response(
            {
                "count": count,
                "page": page,
                "page_size": SITEMAP_PAGE_SIZE,
                "results": [
                    {
                        "listing_key": key,
                        "modified": modified.isoformat() if modified else None,
                    }
                    for key, modified in rows
                ],
            }
        )
