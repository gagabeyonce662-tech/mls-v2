"""Homepage rails: Featured listings and the New Pre-construction ordering."""

from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from .models import Content, PreComProperty, Property

FEATURED_URL = "/api/mls/properties/featured-properties/"
PRECON_URL = "/api/mls/precon-properties/"


def _listing(key, *, days_old=1, status="Active", remarks="", **extra):
    return Property.objects.create(
        listing_key=key,
        city="Toronto",
        state_or_province="ON",
        list_price=800000,
        standard_status=status,
        public_remarks=remarks,
        original_entry_timestamp=timezone.now() - timedelta(days=days_old),
        modification_timestamp=timezone.now() - timedelta(days=days_old),
        category_type=Property.DDF,
        **extra,
    )


class FeaturedPropertiesTests(TestCase):
    def setUp(self):
        cache.clear()

    def keys(self, **params):
        response = self.client.get(FEATURED_URL, params)
        self.assertEqual(response.status_code, 200)
        return [(r["listing_key"], r["featured_source"]) for r in response.json()["results"]]

    def test_pinned_first_in_featured_order_then_exclusive_fill(self):
        _listing("pin-b", is_featured=True, featured_order=2)
        _listing("pin-a", is_featured=True, featured_order=1, days_old=9)
        _listing("pin-unordered", is_featured=True)
        _listing("excl", remarks="EXCLUSIVE to our brokerage: corner lot")
        _listing("plain")

        self.assertEqual(
            self.keys(limit=5),
            [
                ("pin-a", "pinned"),
                ("pin-b", "pinned"),
                ("pin-unordered", "pinned"),
                ("excl", "exclusive"),
            ],
        )

    def test_expired_and_inactive_pins_are_skipped(self):
        _listing("expired", is_featured=True, featured_until=timezone.now() - timedelta(hours=1))
        _listing("sold", is_featured=True, status="Sold")
        _listing("live", is_featured=True, featured_until=timezone.now() + timedelta(days=3))
        _listing("sold-excl", status="Closed", remarks="Exclusive: just sold")

        self.assertEqual(self.keys(limit=6), [("live", "pinned")])

    def test_fill_false_returns_only_pinned(self):
        _listing("pin", is_featured=True)
        _listing("excl", remarks="exclusive listing")
        self.assertEqual(self.keys(limit=6, fill="false"), [("pin", "pinned")])

    def test_limit_caps_pinned(self):
        for i in range(4):
            _listing(f"pin-{i}", is_featured=True, featured_order=i + 1)
        response = self.client.get(FEATURED_URL, {"limit": 2}).json()
        self.assertEqual([r["listing_key"] for r in response["results"]], ["pin-0", "pin-1"])
        self.assertEqual(response["pinned_count"], 2)

    def test_bad_limit_is_400(self):
        self.assertEqual(self.client.get(FEATURED_URL, {"limit": "abc"}).status_code, 400)


class ExclusivePropertiesReadOnlyTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_listing_the_rail_does_not_retag_rows(self):
        row = _listing("excl", remarks="Exclusive offering in Leslieville")
        response = self.client.get("/api/mls/properties/exclusive-properties/", {"limit": 6})
        self.assertEqual(response.status_code, 200)
        self.assertIn("excl", [r["listing_key"] for r in response.json()["results"]])
        row.refresh_from_db()
        self.assertEqual(row.category_type, Property.DDF)


class PreconOrderingTests(TestCase):
    def setUp(self):
        now = timezone.now()

        def project(wp_id, *, published_days_ago, stage="", **extra):
            content = Content.objects.create(
                wp_id=wp_id,
                content_type=Content.PROPERTY,
                title=f"Project {wp_id}",
                slug=f"project-{wp_id}",
                status=Content.PUBLISH,
                published_at=now - timedelta(days=published_days_ago),
            )
            # Saving a property Content may already have created its row.
            project, _ = PreComProperty.objects.update_or_create(
                content=content, defaults={"sales_stage": stage, **extra}
            )
            return project

        # Created in this order, so the legacy "-id" order is the reverse.
        self.newest = project(1, published_days_ago=1, stage=PreComProperty.SALES_STAGE_NOW_SELLING)
        self.sold = project(2, published_days_ago=2, stage=PreComProperty.SALES_STAGE_SOLD_OUT)
        self.oldest = project(3, published_days_ago=30, stage=PreComProperty.SALES_STAGE_COMING_SOON)
        self.pinned = project(4, published_days_ago=60, is_featured=True, featured_order=1)

    def wp_ids(self, **params):
        response = self.client.get(PRECON_URL, params)
        self.assertEqual(response.status_code, 200)
        return [r["wp_id"] for r in response.json()["results"]]

    def test_default_order_unchanged(self):
        self.assertEqual(self.wp_ids(), [4, 3, 2, 1])

    def test_newest_orders_by_published_at(self):
        self.assertEqual(self.wp_ids(ordering="newest"), [1, 2, 3, 4])

    def test_featured_puts_pins_first_and_excludes_sold_out(self):
        self.assertEqual(self.wp_ids(ordering="featured", exclude_stage="sold_out"), [4, 1, 3])

    def test_list_exposes_is_featured(self):
        rows = self.client.get(PRECON_URL, {"ordering": "featured"}).json()["results"]
        self.assertTrue(rows[0]["is_featured"])
        self.assertFalse(rows[1]["is_featured"])
