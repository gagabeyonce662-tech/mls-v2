"""Unit tests for the homepage services.

SimpleTestCase only: the logic lives in pure functions over plain rows, so it
is tested without a database (the project's migrations are Postgres-specific
and the dev database is remote). Run with:

    python manage.py test homepage
"""

from datetime import date

from django.test import SimpleTestCase

from homepage.serializers import NewsletterSubscribeSerializer
from homepage.services.common import base_city, pct
from homepage.services.deals import rank_price_drops
from homepage.services.geo import bounding_box, haversine_km
from homepage.services.market_snapshot import build_snapshot
from homepage.services.news import parse_feed
from homepage.services.rent_estimates import (
    RentalComp,
    annual_condo_fees,
    estimate_rent,
    investor_metrics,
    rank_candidates,
)
from homepage.services.sold_below import find_repeat_sale_losses, normalise_address


class CommonTests(SimpleTestCase):
    def test_base_city_strips_neighbourhood_and_district(self):
        self.assertEqual(base_city("Toronto (Mimico)"), "Toronto")
        self.assertEqual(base_city("Toronto C08"), "Toronto")
        self.assertEqual(base_city("Richmond Hill"), "Richmond Hill")
        self.assertEqual(base_city(None), "")

    def test_pct_guards_zero_base(self):
        self.assertEqual(pct(5, 100), 5.0)
        self.assertIsNone(pct(5, 0))


class GeoTests(SimpleTestCase):
    def test_haversine_known_distance(self):
        # Toronto City Hall → CN Tower is ~1.3 km.
        self.assertAlmostEqual(haversine_km(43.6534, -79.3839, 43.6426, -79.3871), 1.23, delta=0.1)

    def test_bounding_box_contains_radius(self):
        lat_min, lat_max, lng_min, lng_max = bounding_box(43.65, -79.38, 1.0)
        self.assertLess(lat_min, 43.65)
        self.assertGreater(lat_max, 43.65)
        self.assertGreater(haversine_km(43.65, -79.38, lat_max, -79.38), 0.99)


def comps(city, beds, rents):
    return [RentalComp(city=city, bedrooms=beds, monthly_rent=r) for r in rents]


class RentEstimateTests(SimpleTestCase):
    def test_median_of_same_city_same_beds(self):
        pool = comps("Toronto (Mimico)", 2, [2400, 2600, 2500]) + comps("Oakville", 2, [9000] * 5)
        self.assertEqual(estimate_rent(pool, "Toronto C08", 2), (2500, 3))

    def test_widens_to_plus_minus_one_bedroom(self):
        pool = comps("Toronto", 3, [3000]) + comps("Toronto", 2, [2500, 2600])
        self.assertEqual(estimate_rent(pool, "Toronto", 2), (2600, 3))

    def test_no_estimate_without_enough_comps(self):
        self.assertIsNone(estimate_rent(comps("Toronto", 2, [2500, 2600]), "Toronto", 2))
        self.assertIsNone(estimate_rent(comps("Toronto", 2, [1, 2, 3]), "Toronto", None))

    def test_metrics_math(self):
        m = investor_metrics(
            price=600_000, monthly_rent=2_500, comps_used=4,
            annual_tax=3_000, condo_fee=500, condo_fee_frequency="Monthly",
        )
        self.assertEqual(m.gross_yield_pct, 5.0)
        # NOI = 30000*0.96 - (3000 + 6000 + 6000) = 13800 → 2.3%
        self.assertEqual(m.cap_rate_pct, 2.3)

    def test_implausible_yield_rejected(self):
        self.assertIsNone(investor_metrics(
            price=100_000, monthly_rent=5_000, comps_used=3,
            annual_tax=None, condo_fee=None, condo_fee_frequency=None,
        ))

    def test_condo_fee_frequencies(self):
        self.assertEqual(annual_condo_fees(100, "Monthly"), 1200)
        self.assertEqual(annual_condo_fees(1200, "Annually"), 1200)
        self.assertEqual(annual_condo_fees(300, "Quarterly"), 1200)
        self.assertEqual(annual_condo_fees(100, ""), 1200)
        self.assertEqual(annual_condo_fees(None, "Monthly"), 0)

    def test_ranking_orders_by_cap_rate_and_skips_uncomparable(self):
        pool = comps("Toronto", 2, [2500, 2500, 2500])
        rows = [
            {"listing_key": "a", "price": 700_000, "city": "Toronto", "bedrooms": 2},
            {"listing_key": "b", "price": 550_000, "city": "Toronto", "bedrooms": 2},
            {"listing_key": "c", "price": 500_000, "city": "Ajax", "bedrooms": 2},
        ]
        ranked = rank_candidates(rows, pool, limit=5)
        self.assertEqual([r["listing_key"] for r in ranked], ["b", "a"])


class DealsTests(SimpleTestCase):
    def row(self, key, price, original):
        return {"ListingKey": key, "ListPrice": price, "OriginalListPrice": original,
                "UnparsedAddress": "1 Main St, Toronto, ON", "City": "Toronto C01",
                "PriceChangeTimestamp": "2026-09-20T10:00:00Z"}

    def test_ranks_by_drop_and_filters_noise(self):
        rows = [
            self.row("small", 990_000, 1_000_000),   # 1% — noise
            self.row("big", 800_000, 1_000_000),     # 20%
            self.row("mid", 900_000, 1_000_000),     # 10%
            self.row("typo", 100_000, 1_000_000),    # 90% — data error
            self.row("up", 1_100_000, 1_000_000),    # increase
            self.row("big", 800_000, 1_000_000),     # duplicate
        ]
        deals = rank_price_drops(rows, limit=5)
        self.assertEqual([d.mls_number for d in deals], ["big", "mid"])
        self.assertEqual(deals[0].drop_pct, 20.0)
        self.assertEqual(deals[0].city, "Toronto")
        self.assertEqual(deals[0].address, "1 Main St")
        self.assertEqual(deals[0].changed_on, "2026-09-20")


class SoldBelowTests(SimpleTestCase):
    def sale(self, key, address, price, day):
        return {"ListingKey": key, "UnparsedAddress": address, "City": "Oakville",
                "ClosePrice": price, "CloseDate": day}

    def test_normalise_address(self):
        self.assertEqual(
            normalise_address("1240  Marlborough Court Unit 704, Oakville, ON L6H 3K7"),
            "1240 marlborough court 704",
        )

    def test_finds_loss_on_resale(self):
        rows = [
            self.sale("old", "12 Elm St, Oakville, ON", 1_400_000, "2024-11-01"),
            self.sale("new", "12 ELM ST, Oakville, ON L6H", 1_250_000, "2026-03-01"),
            self.sale("x", "14 Elm St, Oakville, ON", 900_000, "2025-01-01"),
        ]
        losses = find_repeat_sale_losses(rows)
        self.assertEqual(len(losses), 1)
        self.assertEqual(losses[0].listing_key, "new")
        self.assertEqual(losses[0].previous_close_price, 1_400_000)
        self.assertEqual(losses[0].close_date, date(2026, 3, 1))

    def test_ignores_gains_quick_resales_and_different_units(self):
        rows = [
            self.sale("a1", "5 Oak Ave, Oakville", 800_000, "2025-01-01"),
            self.sale("a2", "5 Oak Ave, Oakville", 900_000, "2026-01-01"),        # gain
            self.sale("b1", "7 Oak Ave, Oakville", 800_000, "2025-01-01"),
            self.sale("b2", "7 Oak Ave, Oakville", 700_000, "2025-01-20"),        # 19 days
            self.sale("c1", "9 Oak Ave 101, Oakville", 800_000, "2025-01-01"),
            self.sale("c2", "9 Oak Ave 102, Oakville", 600_000, "2026-01-01"),    # other unit
        ]
        self.assertEqual(find_repeat_sale_losses(rows), [])


class MarketSnapshotTests(SimpleTestCase):
    def test_current_vs_previous_window(self):
        today = date(2026, 9, 24)
        rows = [
            {"City": "Toronto C01", "ClosePrice": 1_100_000, "ListPrice": 1_000_000,
             "CloseDate": "2026-09-20", "OriginalEntryTimestamp": "2026-09-10T00:00:00Z"},
            {"City": "Oakville", "ClosePrice": 900_000, "ListPrice": 1_000_000,
             "CloseDate": "2026-09-10", "OriginalEntryTimestamp": "2026-08-31T00:00:00Z"},
            {"City": "Ajax", "ClosePrice": 800_000, "ListPrice": 800_000,
             "CloseDate": "2026-08-10", "OriginalEntryTimestamp": "2026-08-01T00:00:00Z"},
            {"City": "Ajax", "ClosePrice": 9_999_999, "CloseDate": "2925-01-01"},  # corrupt date
        ]
        snap = build_snapshot(rows, today, active_listings=4622)
        self.assertEqual(snap["units_sold"], 2)
        self.assertEqual(snap["median_sold_price"], 1_000_000)
        self.assertEqual(snap["median_sold_price_change_pct"], 25.0)
        self.assertEqual(snap["avg_days_on_market"], 10.0)
        self.assertEqual(snap["units_sold_change_pct"], 100.0)
        self.assertEqual(snap["active_listings"], 4622)


RSS = b"""<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>
<item><title>Rate held at 2.75%</title><link>https://example.com/a</link>
<description>&lt;p&gt;The Bank &lt;b&gt;held&lt;/b&gt; its rate.&lt;/p&gt;</description>
<pubDate>Wed, 23 Sep 2026 14:00:00 GMT</pubDate>
<media:content url="https://example.com/a.jpg" medium="image"/></item>
<item><title>No link</title><pubDate>Wed, 23 Sep 2026 14:00:00 GMT</pubDate></item>
<item><title>Bad scheme</title><link>javascript:alert(1)</link><pubDate>Wed, 23 Sep 2026 14:00:00 GMT</pubDate></item>
</channel></rss>"""

ATOM = b"""<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>Housing starts rise</title><link href="https://example.com/b"/>
<summary>Starts rose 8%.</summary><published>2026-09-22T09:30:00Z</published></entry>
</feed>"""


class NewsParserTests(SimpleTestCase):
    def test_rss(self):
        items = parse_feed(RSS)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].title, "Rate held at 2.75%")
        self.assertEqual(items[0].summary, "The Bank held its rate.")
        self.assertEqual(items[0].image_url, "https://example.com/a.jpg")
        self.assertEqual(items[0].published_at.year, 2026)

    def test_atom_with_childless_link(self):
        items = parse_feed(ATOM)
        self.assertEqual([i.url for i in items], ["https://example.com/b"])

    def test_refuses_entity_declarations(self):
        with self.assertRaises(ValueError):
            parse_feed(b'<?xml version="1.0"?><!DOCTYPE r [<!ENTITY a "x">]><rss/>')


class ConsentTests(SimpleTestCase):
    def test_consent_must_be_true(self):
        for value in (False, "false", None):
            data = {"email": "a@example.com"}
            if value is not None:
                data["consent"] = value
            self.assertFalse(NewsletterSubscribeSerializer(data=data).is_valid())
        self.assertTrue(NewsletterSubscribeSerializer(data={"email": "a@example.com", "consent": True}).is_valid())
