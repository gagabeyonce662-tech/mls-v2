"""Hybrid CMA unit tests — no database / no AMPRE / no OpenAI network."""
from __future__ import annotations

from django.test import SimpleTestCase
from unittest.mock import patch

from mls.services.valuation import ai_cma
from mls.services.valuation.comps import _passes_filters, pricing_comps
from mls.services.valuation.hedonic import apply_hedonic
from mls.services.valuation.momentum import (
    _sold_trend_from_payload,
    blend_with_prior_anchor,
    prior_sale_anchor,
)


def _comp(**overrides):
    base = {
        "listing_key": "X",
        "price": 1_000_000,
        "close_price": 1_000_000,
        "list_price": 990_000,
        "living_area": 2000,
        "bedrooms_total": 3,
        "bathrooms_total_integer": 2,
        "year_built": 2000,
        "property_sub_type": "Detached",
        "distance_km": 1.0,
        "source": "sold",
        "event_date": "2026-06-01",
    }
    base.update(overrides)
    return base


class CompFilterTests(SimpleTestCase):
    def test_city_prefix_strips_toronto_district(self):
        from mls.services.valuation.comps import _city_prefix

        self.assertEqual(_city_prefix("Toronto C01"), "Toronto")
        self.assertEqual(_city_prefix("Mississauga"), "Mississauga")
        self.assertEqual(_city_prefix("Richmond Hill"), "Richmond Hill")

    def test_ampre_row_without_coords_still_usable(self):
        from mls.services.valuation.comps import _ampre_row_to_comp

        comp = _ampre_row_to_comp(
            {
                "ListingKey": "A1",
                "ClosePrice": 875000,
                "CloseDate": "2026-05-01",
                "City": "Toronto C01",
                "PropertySubType": "Condo Apartment",
                "BedroomsTotal": 2,
                "UnparsedAddress": "1 Main St",
            },
            43.65,
            -79.38,
        )
        self.assertIsNotNone(comp)
        self.assertEqual(comp["source"], "sold")
        self.assertEqual(comp["price"], 875000)
        self.assertEqual(comp["distance_km"], 4.0)

    def test_wowa_pass_rejects_far_and_wrong_size(self):
        ok = _comp(distance_km=1.5, living_area=2000)
        far = _comp(distance_km=3.0, living_area=2000)
        big = _comp(distance_km=1.0, living_area=2500)
        kwargs = dict(
            sub_sqft=2000.0,
            sub_beds=3,
            sub_year=2000,
            sub_type="detached",
            sqft_tol=0.10,
            age_years=5,
            radius_km=2.0,
            require_subtype=True,
            max_age_days=365,
        )
        self.assertTrue(_passes_filters(ok, **kwargs))
        self.assertFalse(_passes_filters(far, **kwargs))
        self.assertFalse(_passes_filters(big, **kwargs))

    def test_pricing_comps_prefers_real_sold(self):
        comps = [
            _comp(listing_key="s1", source="sold"),
            _comp(listing_key="s2", source="sold"),
            _comp(listing_key="s3", source="sold"),
            _comp(listing_key="p1", source="sold_proxy", price=900_000),
        ]
        priced = pricing_comps(comps)
        self.assertEqual(len(priced), 3)
        self.assertTrue(all(c["source"] == "sold" for c in priced))


class MomentumTests(SimpleTestCase):
    def test_sold_trend_payload_fractions(self):
        payload = {
            "months": [
                {"month": "2025-10", "median_sold_price": 900_000, "units_sold": 10},
                {"month": "2025-11", "median_sold_price": 910_000, "units_sold": 12},
                {"month": "2025-12", "median_sold_price": 920_000, "units_sold": 11},
                {"month": "2026-01", "median_sold_price": 930_000, "units_sold": 9},
                {"month": "2026-02", "median_sold_price": 940_000, "units_sold": 10},
                {"month": "2026-03", "median_sold_price": 960_000, "units_sold": 8},
            ]
        }
        trend = _sold_trend_from_payload(payload)
        self.assertEqual(trend["source"], "sold_close_price")
        self.assertTrue(abs(trend["pct_30d"]) < 1)  # fraction, not percent number
        self.assertEqual(len(trend["series"]), 6)
        self.assertLessEqual(abs(trend["applied"]), 0.08)

    def test_prior_sale_anchor_and_blend(self):
        trend = {"pct_12m": 0.05, "applied": 0.02}
        subject = {"last_sold_price": 800_000, "last_sold_date": "2024-04-01"}
        anchor = prior_sale_anchor(subject, trend)
        self.assertIsNotNone(anchor)
        self.assertGreater(anchor, 800_000)
        blended = blend_with_prior_anchor(1_000_000, anchor, weight=0.15)
        self.assertNotEqual(blended, 1_000_000)


class HedonicTests(SimpleTestCase):
    def test_breakdown_tagged_hedonic(self):
        subject = {"living_area": 2100, "bedrooms_total": 4, "bathrooms_total": 3, "parking_total": 2}
        comps = [
            _comp(price=950_000, living_area=1900, bedrooms_total=3, bathrooms_total_integer=2),
            _comp(price=1_000_000, living_area=2000, bedrooms_total=3, bathrooms_total_integer=2),
            _comp(price=1_050_000, living_area=2100, bedrooms_total=4, bathrooms_total_integer=3),
            _comp(price=980_000, living_area=1950, bedrooms_total=3, bathrooms_total_integer=2),
            _comp(price=1_020_000, living_area=2050, bedrooms_total=3, bathrooms_total_integer=2),
        ]
        out = apply_hedonic(subject, comps)
        self.assertGreater(out["point"], 0)
        self.assertTrue(all(row.get("source") == "hedonic" for row in out["breakdown"]))


class AiCmaTests(SimpleTestCase):
    def test_blend_weights(self):
        ai = {"used": True, "suggested": 1_200_000}
        self.assertEqual(ai_cma.blend(1_000_000, ai), 0.65 * 1_000_000 + 0.35 * 1_200_000)
        self.assertEqual(ai_cma.blend(1_000_000, {"used": False}), 1_000_000)

    def test_rejects_out_of_band_suggestion(self):
        with patch.object(ai_cma.openai_client, "is_configured", return_value=True):
            with patch.object(ai_cma.openai_client, "search_model", return_value="test"):
                with patch.object(
                    ai_cma.openai_client,
                    "chat",
                    return_value=type(
                        "R",
                        (),
                        {
                            "content": (
                                '{"suggested_market_value": 5000000, "confidence": "high",'
                                ' "rationale": "too high", "adjustments": []}'
                            )
                        },
                    )(),
                ):
                    out = ai_cma.suggest(
                        {"bedrooms_total": 3},
                        [_comp()],
                        [],
                        {"pct_30d": 0.01},
                        cma_point=1_000_000,
                    )
        self.assertFalse(out["used"])

    def test_unused_when_not_configured(self):
        with patch.object(ai_cma.openai_client, "is_configured", return_value=False):
            out = ai_cma.suggest({}, [], [], {}, cma_point=500_000)
        self.assertFalse(out["used"])
