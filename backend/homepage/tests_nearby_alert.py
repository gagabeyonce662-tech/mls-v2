"""Nearby-alert coordinates. SimpleTestCase: no database."""

from decimal import Decimal
from types import SimpleNamespace

from django.test import SimpleTestCase

from homepage.serializers import NearbyAlertCreateSerializer


class NearbyAlertCoordinateTests(SimpleTestCase):
    def test_seven_decimal_latitude_is_rounded(self):
        request = SimpleNamespace(user=SimpleNamespace(email="sam@example.com"))
        serializer = NearbyAlertCreateSerializer(
            data={
                "label": "Bram Landing, Hilton Head Island",
                "latitude": 32.1985387,
                "longitude": -80.718997,
                "radius_km": 1,
                "consent": True,
            },
            context={"request": request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["latitude"], Decimal("32.198539"))
        self.assertEqual(serializer.validated_data["longitude"], Decimal("-80.718997"))
