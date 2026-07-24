from datetime import date, time

from django.test import SimpleTestCase

from mls.services.ddf.open_house_mapper import (
    map_open_house_defaults,
)


class OpenHouseMapperTests(SimpleTestCase):
    def test_maps_ddf_open_house_values(self):
        raw = {
            "OpenHouseKey": "OH-123",
            "ListingKey": "LISTING-123",
            "ListingId": "MLS123",
            "OpenHouseDate": "2026-07-25",
            "OpenHouseStartTime": "14:00:00.00",
            "OpenHouseEndTime": "16:00:00.00",
            "OpenHouseRemarks": "Public open house",
            "OpenHouseType": "Public",
            "OpenHouseStatus": "Active",
            "LivestreamOpenHouseURL": "https://example.com/live",
        }

        result = map_open_house_defaults(raw)

        self.assertEqual(result["listing_id"], "MLS123")
        self.assertEqual(
            result["date"],
            date(2026, 7, 25),
        )
        self.assertEqual(
            result["start_time"],
            time(14, 0),
        )
        self.assertEqual(
            result["end_time"],
            time(16, 0),
        )
        self.assertEqual(
            result["remarks"],
            "Public open house",
        )
        self.assertEqual(
            result["open_house_type"],
            "Public",
        )
        self.assertEqual(
            result["status"],
            "Active",
        )