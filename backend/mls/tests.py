from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from mls.models import Property


class MapAggregationAndFilterTests(TestCase):
    def setUp(self):
        self.p1 = Property.objects.create(
            listing_key="listing-1",
            city="Toronto",
            state_or_province="ON",
            unparsed_address="123 King St",
            public_remarks="Downtown loft with skyline views",
            latitude=43.6500,
            longitude=-79.3800,
            list_price=900000,
            bedrooms_total=2,
            bathrooms_total_integer=2,
            standard_status="Active",
            category_type=Property.EXCLUSIVE,
        )
        self.p2 = Property.objects.create(
            listing_key="listing-2",
            city="Mississauga",
            state_or_province="ON",
            unparsed_address="9 Lakeshore Rd",
            public_remarks="Family home with backyard",
            latitude=43.5900,
            longitude=-79.6500,
            list_price=1100000,
            bedrooms_total=3,
            bathrooms_total_integer=2,
            standard_status="Active",
            category_type=Property.EXCLUSIVE,
        )

    def test_map_aggregates_returns_listings_mode_for_high_zoom(self):
        response = self.client.get(
            "/api/mls/properties/map-aggregates/",
            {
                "latitude_min": 43.0,
                "latitude_max": 44.0,
                "longitude_min": -80.0,
                "longitude_max": -79.0,
                "zoom": 13,
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["mode"], "listings")
        self.assertIsNone(payload["resolution"])

    def test_map_aggregates_applies_city_filter(self):
        response = self.client.get(
            "/api/mls/properties/map-aggregates/",
            {
                "latitude_min": 43.0,
                "latitude_max": 44.0,
                "longitude_min": -80.0,
                "longitude_max": -79.0,
                "zoom": 10,
                "city": "Toronto",
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["mode"], "aggregates")
        self.assertEqual(payload["meta"]["filters_applied"], True)
        total_count = sum(cell["property_count"] for cell in payload["results"])
        self.assertEqual(total_count, 1)

    def test_property_filter_search_is_not_dropped(self):
        response = self.client.get(
            "/api/mls/properties/filter/",
            {"search": "King St", "limit": 20, "offset": 0},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        keys = {row["listing_key"] for row in payload["results"]}
        self.assertIn(self.p1.listing_key, keys)
        self.assertNotIn(self.p2.listing_key, keys)


class WatchedAPITests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="watched@example.com",
            password="safe-password-123",
        )
        self.url_overview = "/api/mls/watched/"
        self.url_favorite_toggle = "/api/mls/watched/favorites/toggle/"
        self.url_history_add = "/api/mls/watched/history/add/"
        self.url_favorites_clear = "/api/mls/watched/favorites/clear/"
        self.url_history_clear = "/api/mls/watched/history/clear/"

    def _auth(self):
        refresh = RefreshToken.for_user(self.user)
        token = str(refresh.access_token)
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"

    def test_watched_endpoints_require_auth(self):
        response = self.client.get(self.url_overview)
        self.assertEqual(response.status_code, 401)

    def test_favorite_toggle_is_idempotent(self):
        self._auth()
        payload = {
            "property_key": "listing-123",
            "property_snapshot_json": {"listing_key": "listing-123"},
        }

        first = self.client.post(
            self.url_favorite_toggle, payload, content_type="application/json"
        )
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json()["is_favorite"], True)

        second = self.client.post(
            self.url_favorite_toggle, payload, content_type="application/json"
        )
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json()["is_favorite"], False)

    def test_history_dedupes_and_keeps_latest_order(self):
        self._auth()
        keys = ["listing-a", "listing-b", "listing-c"]
        for key in keys:
            self.client.post(
                self.url_history_add,
                {"property_key": key, "property_snapshot_json": {"listing_key": key}},
                content_type="application/json",
            )

        # Re-add older key, should move to top and stay unique.
        self.client.post(
            self.url_history_add,
            {
                "property_key": "listing-a",
                "property_snapshot_json": {"listing_key": "listing-a", "v": 2},
            },
            content_type="application/json",
        )

        response = self.client.get(self.url_overview)
        self.assertEqual(response.status_code, 200)
        history = response.json()["history"]
        self.assertEqual(history[0]["property_key"], "listing-a")
        self.assertEqual(len(history), 3)

    def test_history_cap_is_enforced(self):
        self._auth()
        for idx in range(60):
            key = f"listing-{idx}"
            self.client.post(
                self.url_history_add,
                {"property_key": key, "property_snapshot_json": {"listing_key": key}},
                content_type="application/json",
            )

        response = self.client.get(self.url_overview)
        self.assertEqual(response.status_code, 200)
        history = response.json()["history"]
        self.assertEqual(len(history), 50)

    def test_clear_endpoints_remove_user_data(self):
        self._auth()
        self.client.post(
            self.url_favorite_toggle,
            {"property_key": "fav-1", "property_snapshot_json": {"listing_key": "fav-1"}},
            content_type="application/json",
        )
        self.client.post(
            self.url_history_add,
            {"property_key": "hist-1", "property_snapshot_json": {"listing_key": "hist-1"}},
            content_type="application/json",
        )

        clear_fav = self.client.delete(self.url_favorites_clear)
        clear_hist = self.client.delete(self.url_history_clear)
        self.assertEqual(clear_fav.status_code, 200)
        self.assertEqual(clear_hist.status_code, 200)

        response = self.client.get(self.url_overview)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["favorites"], [])
        self.assertEqual(response.json()["history"], [])
