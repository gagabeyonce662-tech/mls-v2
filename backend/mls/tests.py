import json
from datetime import timedelta
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from mls.models import (
    Property,
    PropertyInquiry,
    CommunityListing,
    PropertySoldProxy,
    Agent,
    AgentServiceArea,
)
from mls.services.valuation.comps import select_comps, haversine_km
from mls.services.valuation.hedonic import apply_hedonic
from mls.services.valuation.agents import match_agent
from mls.services.valuation.lot_dims import parse_lot_depth_from_dimensions, infer_lot_depth


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
        self.p3 = Property.objects.create(
            listing_key="listing-3",
            city="Toronto",
            state_or_province="ON",
            unparsed_address="77 Dundas St",
            public_remarks="Recently sold condo unit",
            latitude=43.6540,
            longitude=-79.3810,
            list_price=820000,
            bedrooms_total=1,
            bathrooms_total_integer=1,
            standard_status="Sold",
        )
        self.p4 = Property.objects.create(
            listing_key="listing-4",
            city="Toronto",
            state_or_province="ON",
            unparsed_address="5 Bay St",
            public_remarks="Listing was terminated by seller",
            latitude=43.6420,
            longitude=-79.3770,
            list_price=700000,
            bedrooms_total=1,
            bathrooms_total_integer=1,
            standard_status="Terminated",
            lease_amount=2800,
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
        self.assertEqual(total_count, 3)

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

    def test_property_filter_postal_search_normalizes_spaces(self):
        self.p1.postal_code = "N2E 4L5"
        self.p1.save(update_fields=["postal_code"])
        response = self.client.get(
            "/api/mls/properties/filter/",
            {"search": "N2E4L5", "limit": 20, "offset": 0},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        keys = {row["listing_key"] for row in payload["results"]}
        self.assertIn(self.p1.listing_key, keys)

    def test_property_filter_status_group_supports_multi_select(self):
        response = self.client.get(
            "/api/mls/properties/filter/",
            {"status_group": "sold,de-listed", "limit": 30, "offset": 0},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        keys = {row["listing_key"] for row in payload["results"]}
        self.assertIn(self.p3.listing_key, keys)
        self.assertIn(self.p4.listing_key, keys)
        self.assertNotIn(self.p1.listing_key, keys)

    def test_property_filter_modified_within_days(self):
        old_ts = timezone.now() - timedelta(days=40)
        recent_ts = timezone.now() - timedelta(days=2)
        Property.objects.filter(pk=self.p2.pk).update(modification_timestamp=old_ts)
        Property.objects.filter(pk=self.p1.pk).update(modification_timestamp=recent_ts)
        response = self.client.get(
            "/api/mls/properties/filter/",
            {"status_group": "active", "modified_within_days": 7, "limit": 30},
        )
        self.assertEqual(response.status_code, 200)
        keys = {row["listing_key"] for row in response.json()["results"]}
        self.assertIn(self.p1.listing_key, keys)
        self.assertNotIn(self.p2.listing_key, keys)

    def test_map_aggregates_respects_status_group_and_has_lease(self):
        response = self.client.get(
            "/api/mls/properties/map-aggregates/",
            {
                "latitude_min": 43.0,
                "latitude_max": 44.0,
                "longitude_min": -80.0,
                "longitude_max": -79.0,
                "zoom": 10,
                "status_group": "de-listed",
                "has_lease": "true",
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["mode"], "aggregates")
        total_count = sum(cell["property_count"] for cell in payload["results"])
        self.assertEqual(total_count, 1)

    def test_exclusive_search_typo_city_returns_fallback_match(self):
        self.p1.city = "Kitchener"
        self.p1.category_type = Property.EXCLUSIVE
        self.p1.save(update_fields=["city", "category_type"])
        response = self.client.get(
            "/api/mls/properties/exclusive-properties/",
            {"search": "kitchner", "limit": 20, "offset": 0},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        keys = {row["listing_key"] for row in payload["results"]}
        self.assertIn(self.p1.listing_key, keys)
        self.assertIn("fallback_applied", payload)

    def test_exclusive_fallback_keeps_same_listing_type(self):
        Property.objects.create(
            listing_key="lease-only-1",
            city="Kitchener",
            state_or_province="ON",
            unparsed_address="20 Queen St",
            public_remarks="Commercial lease in central district",
            latitude=43.4516,
            longitude=-80.4925,
            list_price=600000,
            lease_amount=3500,
            bedrooms_total=0,
            bathrooms_total_integer=1,
            standard_status="Active",
        )
        response = self.client.get(
            "/api/mls/properties/exclusive-properties/",
            {"search": "zzzx-not-a-real-place", "limit": 20, "offset": 0},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload.get("fallback_applied"))
        self.assertGreater(len(payload["results"]), 0)
        for row in payload["results"]:
            self.assertNotEqual(row.get("listing_key"), "lease-only-1")


class EstatePropertyAPITests(TestCase):
    @override_settings(DEBUG=False)
    def test_estate_property_schema_returns_table_metadata(self):
        response = self.client.get("/api/mls/estate-properties/schema/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["table"], "mls_estateproperty")
        self.assertTrue(
            any(col["column_name"] == "listing_key" for col in payload["columns"]),
        )
        self.assertTrue(
            any(col["column_name"] == "custom_tags" for col in payload["columns"]),
        )

    @override_settings(DEBUG=False)
    def test_estate_property_get_is_public_but_writes_require_staff(self):
        response = self.client.get("/api/mls/estate-properties/")
        self.assertEqual(response.status_code, 200)

        create_payload = {
            "listing_key": "estate-public-1",
            "property_title": "Public Estate Home",
            "city": "Toronto",
            "publish_status": "published",
            "list_price": 1250000,
            "is_featured": True,
            "custom_tags": "Waterfront, Luxury",
        }

        denied_create = self.client.post(
            "/api/mls/estate-properties/",
            data=json.dumps(create_payload),
            content_type="application/json",
        )
        self.assertIn(denied_create.status_code, {401, 403})

        staff_user = get_user_model().objects.create_user(
            email="estate-admin@example.com",
            password="safe-password-123",
            is_staff=True,
        )
        self.client.force_login(staff_user)

        created = self.client.post(
            "/api/mls/estate-properties/",
            data=json.dumps(create_payload),
            content_type="application/json",
        )
        self.assertEqual(created.status_code, 200)
        created_json = created.json()
        self.assertEqual(created_json["listing_key"], create_payload["listing_key"])
        self.assertIsNotNone(created_json["id"])
        self.assertEqual(created_json["is_featured"], True)
        self.assertEqual(created_json["custom_tags"], "Waterfront, Luxury")

        estate_id = created_json["id"]

        listed = self.client.get(
            "/api/mls/estate-properties/",
            {"search": create_payload["listing_key"], "page_size": 5},
        )
        self.assertEqual(listed.status_code, 200)
        listed_json = listed.json()
        self.assertGreaterEqual(listed_json["count"], 1)
        self.assertTrue(
            any(row["id"] == estate_id for row in listed_json["results"]),
        )

        updated = self.client.patch(
            f"/api/mls/estate-properties/{estate_id}/",
            data=json.dumps({"property_title": "Updated Public Estate Home"}),
            content_type="application/json",
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["property_title"], "Updated Public Estate Home")

        deleted = self.client.delete(f"/api/mls/estate-properties/{estate_id}/")
        self.assertEqual(deleted.status_code, 204)

    @override_settings(DEBUG=False)
    def test_estate_property_write_endpoints_require_admin_when_debug_off(self):
        response = self.client.get("/api/mls/estate-properties/")
        self.assertEqual(response.status_code, 200)

        create_payload = {
            "listing_key": "estate-private-1",
            "property_title": "Private Estate Home",
            "city": "Toronto",
            "publish_status": "draft",
        }
        created = self.client.post(
            "/api/mls/estate-properties/",
            data=json.dumps(create_payload),
            content_type="application/json",
        )
        self.assertIn(created.status_code, {401, 403})

    @override_settings(DEBUG=False)
    def test_estate_property_multi_description_sections_syncs_legacy_field(self):
        staff_user = get_user_model().objects.create_user(
            email="estate-admin-sections@example.com",
            password="safe-password-123",
            is_staff=True,
        )
        self.client.force_login(staff_user)

        create_payload = {
            "listing_key": "estate-sections-1",
            "property_title": "Sections Estate Home",
            "city": "Toronto",
            "publish_status": "draft",
            "description_sections_json": [
                {
                    "id": "intro",
                    "title": "Introduction",
                    "body_html": "<p>Primary intro section</p>",
                    "order": 0,
                },
                {
                    "id": "community",
                    "title": "Community",
                    "body_html": "<p>Community details section</p>",
                    "order": 1,
                },
            ],
        }

        created = self.client.post(
            "/api/mls/estate-properties/",
            data=json.dumps(create_payload),
            content_type="application/json",
        )
        self.assertEqual(created.status_code, 200)
        created_json = created.json()
        self.assertEqual(created_json["property_description"], "<p>Primary intro section</p>")
        self.assertEqual(len(created_json.get("description_sections_json") or []), 2)

        estate_id = created_json["id"]
        updated = self.client.patch(
            f"/api/mls/estate-properties/{estate_id}/",
            data=json.dumps({"description_sections_json": []}),
            content_type="application/json",
        )
        self.assertEqual(updated.status_code, 200)
        updated_json = updated.json()
        self.assertEqual(updated_json.get("property_description"), "")
        self.assertEqual(updated_json.get("description_sections_json"), [])

    @override_settings(DEBUG=False)
    def test_estate_property_create_syncs_gallery_fields(self):
        staff_user = get_user_model().objects.create_user(
            email="estate-admin-gallery@example.com",
            password="safe-password-123",
            is_staff=True,
        )
        self.client.force_login(staff_user)

        image_urls = [
            "https://res.cloudinary.com/demo/image/upload/sample-1.jpg",
            "https://res.cloudinary.com/demo/image/upload/sample-2.jpg",
        ]
        payload = {
            "listing_key": "estate-gallery-1",
            "property_title": "Gallery Estate Home",
            "city": "Toronto",
            "publish_status": "draft",
            "image_urls": image_urls,
        }
        response = self.client.post(
            "/api/mls/estate-properties/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("featured_image_url"), image_urls[0])
        self.assertEqual((data.get("wp_post_json") or {}).get("images"), image_urls)
        self.assertEqual((data.get("wp_post_json") or {}).get("gallery"), image_urls)
        self.assertEqual(
            (data.get("wp_meta_json") or {}).get("gallery_image_urls"),
            image_urls,
        )

    @override_settings(DEBUG=False)
    def test_estate_property_media_upload_accepts_multiple_images(self):
        staff_user = get_user_model().objects.create_user(
            email="estate-admin-upload@example.com",
            password="safe-password-123",
            is_staff=True,
        )
        self.client.force_login(staff_user)

        gif_bytes = (
            b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!"
            b"\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00"
            b"\x00\x02\x02D\x01\x00;"
        )
        file_a = SimpleUploadedFile("a.gif", gif_bytes, content_type="image/gif")
        file_b = SimpleUploadedFile("b.gif", gif_bytes, content_type="image/gif")

        response = self.client.post(
            "/api/mls/estate-properties/media-upload/",
            data={"images": [file_a, file_b]},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload.get("count"), 2)
        self.assertEqual(len(payload.get("results") or []), 2)
        for row in payload.get("results") or []:
            self.assertTrue(str(row.get("url") or ""))


class WatchedAPITests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="watched@example.com",
            password="safe-password-123",
        )
        self.url_overview = "/api/mls/watched/"
        self.url_favorite_toggle = "/api/mls/watched/favorites/toggle/"
        self.url_history_add = "/api/mls/watched/history/add/"
        self.url_toured_toggle = "/api/mls/watched/toured/toggle/"
        self.url_area_follow = "/api/mls/watched/areas/follow/"
        self.url_area_unfollow = "/api/mls/watched/areas/unfollow/"
        self.url_alert_prefs = "/api/mls/watched/alerts/preferences/"
        self.url_favorites_clear = "/api/mls/watched/favorites/clear/"
        self.url_history_clear = "/api/mls/watched/history/clear/"
        self.url_toured_clear = "/api/mls/watched/toured/clear/"
        self.url_areas_clear = "/api/mls/watched/areas/clear/"

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

    def test_toured_toggle_and_clear(self):
        self._auth()
        payload = {
            "property_key": "tour-1",
            "property_snapshot_json": {"listing_key": "tour-1"},
        }
        first = self.client.post(
            self.url_toured_toggle, payload, content_type="application/json"
        )
        self.assertEqual(first.status_code, 200)
        self.assertTrue(first.json()["is_toured"])

        overview = self.client.get(self.url_overview).json()
        self.assertEqual(len(overview["toured"]), 1)

        clear_toured = self.client.delete(self.url_toured_clear)
        self.assertEqual(clear_toured.status_code, 200)
        overview = self.client.get(self.url_overview).json()
        self.assertEqual(overview["toured"], [])

    def test_followed_areas_flow(self):
        self._auth()
        follow = self.client.post(
            self.url_area_follow,
            {
                "area_key": "downtown-toronto",
                "area_label": "Downtown Toronto",
                "area_kind": "community",
            },
            content_type="application/json",
        )
        self.assertEqual(follow.status_code, 200)

        overview = self.client.get(self.url_overview).json()
        self.assertEqual(len(overview["followed_areas"]), 1)

        unfollow = self.client.post(
            self.url_area_unfollow,
            {"area_key": "downtown-toronto"},
            content_type="application/json",
        )
        self.assertEqual(unfollow.status_code, 200)
        overview = self.client.get(self.url_overview).json()
        self.assertEqual(overview["followed_areas"], [])

    def test_alert_preferences_update(self):
        self._auth()
        response = self.client.put(
            self.url_alert_prefs,
            {"price_changes": False, "email_enabled": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["price_changes"])
        self.assertFalse(data["email_enabled"])


class CommunityListingAPITests(TestCase):
    def setUp(self):
        self.community_property = Property.objects.create(
            listing_key="community-1",
            city="Toronto",
            state_or_province="ON",
            unparsed_address="10 Community Way",
            public_remarks="Great community-oriented home",
            latitude=43.7000,
            longitude=-79.4000,
            list_price=950000,
            bedrooms_total=3,
            bathrooms_total_integer=2,
            standard_status="Active",
        )
        self.non_community_property = Property.objects.create(
            listing_key="regular-1",
            city="Toronto",
            state_or_province="ON",
            unparsed_address="99 Regular St",
            public_remarks="Regular listing",
            latitude=43.6900,
            longitude=-79.3900,
            list_price=870000,
            bedrooms_total=2,
            bathrooms_total_integer=2,
            standard_status="Active",
        )
        CommunityListing.objects.create(
            property=self.community_property,
            community_name="River District",
            community_slug="river-district",
            badge="Featured",
            rank=1,
            is_published=True,
        )

    def test_community_properties_endpoint_returns_only_published_community_listings(self):
        response = self.client.get(
            "/api/mls/properties/community-properties/",
            {"limit": 20, "offset": 0},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        keys = {row["listing_key"] for row in payload["results"]}
        self.assertIn(self.community_property.listing_key, keys)
        self.assertNotIn(self.non_community_property.listing_key, keys)

    def test_community_properties_endpoint_includes_community_metadata(self):
        response = self.client.get(
            "/api/mls/properties/community-properties/",
            {"community_slug": "river-district", "limit": 20, "offset": 0},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], 1)
        first = payload["results"][0]
        self.assertEqual(first["community_name"], "River District")
        self.assertEqual(first["community_slug"], "river-district")
        self.assertEqual(first["community_badge"], "Featured")


@override_settings(ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"])
class PropertyInquiryAPITests(TestCase):
    def test_post_creates_property_inquiry(self):
        payload = {
            "first_name": "Pat",
            "email": "pat@example.com",
            "message": "Need a townhouse near transit under 950k thanks.",
        }
        response = self.client.post(
            "/api/mls/inquiries/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        obj = PropertyInquiry.objects.get(pk=data["id"])
        self.assertEqual(obj.first_name, "Pat")
        self.assertEqual(obj.email, "pat@example.com")
        self.assertEqual(obj.status, "new")

    def test_message_too_short_returns_400(self):
        response = self.client.post(
            "/api/mls/inquiries/",
            data=json.dumps(
                {
                    "first_name": "Pat",
                    "email": "pat@example.com",
                    "message": "short",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)


class ValuationServiceTests(TestCase):
    def test_parse_lot_depth_from_dimensions(self):
        self.assertEqual(parse_lot_depth_from_dimensions("120 x 45 ft"), Decimal("45"))
        self.assertIsNone(parse_lot_depth_from_dimensions(""))

    def test_infer_lot_depth_fallback_area_over_frontage(self):
        d = infer_lot_depth(None, Decimal("5000"), Decimal("50"))
        self.assertEqual(d, Decimal("100"))

    def test_haversine_small_distance(self):
        d = haversine_km(43.65, -79.38, 43.651, -79.381)
        self.assertLess(d, 2.0)

    def test_select_comps_prefers_sold_proxy_nearby(self):
        now = timezone.now()
        p = Property.objects.create(
            listing_key="val-subject",
            city="Toronto",
            state_or_province="ON",
            postal_code="M5V 1A1",
            unparsed_address="100 King St",
            latitude=43.6500,
            longitude=-79.3800,
            list_price=900000,
            bedrooms_total=3,
            bathrooms_total_integer=2,
            living_area=Decimal("1800"),
            standard_status="Active",
            property_sub_type="Detached",
        )
        PropertySoldProxy.objects.create(
            listing_key="val-comp-1",
            last_list_price=Decimal("850000"),
            sold_at_proxy=now - timedelta(days=30),
            fsa="M5V",
            latitude=Decimal("43.6510"),
            longitude=Decimal("-79.3810"),
            bedrooms_total=3,
            bathrooms_total_integer=2,
            living_area=Decimal("1750"),
            property_sub_type="Detached",
            city="Toronto",
            unparsed_address="101 King St",
        )
        subject = {
            "latitude": float(p.latitude),
            "longitude": float(p.longitude),
            "property_sub_type": "Detached",
            "bedrooms_total": 3,
            "living_area": 1800.0,
        }
        comps = select_comps(subject, radius_km=5.0, max_age_days=365, k=6)
        self.assertGreaterEqual(len(comps), 1)
        self.assertEqual(comps[0]["source"], "sold_proxy")

    def test_apply_hedonic_returns_bracket(self):
        comps = [
            {
                "price": 800000,
                "living_area": 1600,
                "bedrooms_total": 3,
                "bathrooms_total_integer": 2,
                "parking_total": 2,
                "tax_annual_amount": 4000,
                "lot_area": 4000,
            },
            {
                "price": 820000,
                "living_area": 1700,
                "bedrooms_total": 3,
                "bathrooms_total_integer": 2,
                "parking_total": 2,
                "tax_annual_amount": 4200,
                "lot_area": 4200,
            },
        ]
        subject = {
            "living_area": 1650.0,
            "bedrooms_total": 3,
            "bathrooms_total": 2,
            "bedrooms_partial": 0,
            "parking_total": 2,
            "tax_annual_amount": 4100.0,
            "lot_frontage": 40.0,
            "lot_depth": 100.0,
        }
        out = apply_hedonic(subject, comps)
        self.assertGreater(out["point"], 0)
        self.assertLess(out["low"], out["point"])
        self.assertGreater(out["high"], out["point"])

    def test_match_agent_fsa_priority(self):
        ag = Agent.objects.create(name="Alex Agent", email="a@example.com", phone="416-000-0000", is_active=True)
        AgentServiceArea.objects.create(agent=ag, kind=AgentServiceArea.KIND_FSA, key="M5V")
        m = match_agent("M5V", "Toronto", "")
        self.assertIsNotNone(m)
        self.assertEqual(m["name"], "Alex Agent")


@override_settings(ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"])
class ValuationAPITests(TestCase):
    def setUp(self):
        self.p = Property.objects.create(
            listing_key="val-api-1",
            city="Toronto",
            state_or_province="ON",
            postal_code="M5H2N2",
            unparsed_address="200 Wellington St W",
            latitude=43.6450,
            longitude=-79.3800,
            list_price=950000,
            bedrooms_total=2,
            bathrooms_total_integer=2,
            living_area=Decimal("1100"),
            standard_status="Active",
            property_sub_type="Condo",
        )

    def test_autocomplete_returns_results(self):
        r = self.client.get("/api/mls/valuation/autocomplete/", {"q": "Wellington"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertGreaterEqual(len(data["results"]), 1)
        self.assertTrue(any("Wellington" in x["label"] for x in data["results"]))

    def test_lookup_by_listing_key(self):
        r = self.client.get("/api/mls/valuation/lookup/", {"listing_key": self.p.listing_key})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["listing_key"], self.p.listing_key)
        self.assertEqual(data["bedrooms_total"], 2)

    def test_estimate_sparse_without_sold_proxy(self):
        body = {
            "listing_key": self.p.listing_key,
            "latitude": float(self.p.latitude),
            "longitude": float(self.p.longitude),
            "postal_code": self.p.postal_code,
            "city": self.p.city,
            "property_sub_type": "Condo",
            "bedrooms_total": 2,
            "bathrooms_total": 2,
            "living_area": 1100,
        }
        r = self.client.post(
            "/api/mls/valuation/estimate/",
            data=json.dumps(body),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue("estimate" in data)
        self.assertIn("sparse", data)
        self.assertTrue(data["beta"])
