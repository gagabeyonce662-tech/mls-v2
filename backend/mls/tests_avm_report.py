"""AVM report helpers. SimpleTestCase: no database."""
from decimal import Decimal

from django.test import SimpleTestCase

from mls.services.valuation import avm_report as avm


class AvmHelperTests(SimpleTestCase):
    def test_yes_no_treats_blank_as_unknown(self):
        self.assertIsNone(avm._yes_no(""))
        self.assertFalse(avm._yes_no("None"))
        self.assertTrue(avm._yes_no("Central air conditioning"))

    def test_metres_convert_to_feet(self):
        self.assertEqual(avm._feet(Decimal("10"), "meters"), 32.81)
        self.assertEqual(avm._feet(Decimal("38.93"), "feet"), 38.93)
        self.assertIsNone(avm._feet(None, "feet"))

    def test_stars_follow_confidence_band(self):
        self.assertEqual(avm.confidence_stars("high", 8), 5)
        self.assertEqual(avm.confidence_stars("high", 6), 4)
        self.assertEqual(avm.confidence_stars("medium", 4), 3)
        self.assertEqual(avm.confidence_stars("low", 1), 1)
        self.assertEqual(avm.confidence_stars("none", 0), 0)

    def test_subject_uses_entered_values_without_a_listing(self):
        details = avm.subject_details(
            None,
            {"bedrooms_total": 3, "bathrooms_total": 2, "living_area": 2004.0, "property_sub_type": "Detached", "lot_frontage": 38.0},
        )
        self.assertEqual(details["bedrooms"], 3)
        self.assertEqual(details["floor_area_sqft"], 2004.0)
        self.assertEqual(details["property_style"], "Detached")
        self.assertEqual(details["frontage_ft"], 38.0)
        self.assertIsNone(details["heating"])
        self.assertEqual(set(details), set(avm.DETAIL_KEYS))
