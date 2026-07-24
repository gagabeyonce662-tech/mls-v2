from unittest.mock import patch

from django.test import TestCase

from mls.management.commands.sync_ddf_properties import Command
from mls.models import OpenHouse, Property


class OpenHouseSyncTests(TestCase):
    def setUp(self):
        self.cached_property = Property.objects.create(
            listing_key="LISTING-1",
            category_type=Property.DDF,
            city="Toronto",
        )

    @patch(
        "mls.management.commands.sync_ddf_properties."
        "fetch_all_open_houses"
    )
    def test_sync_open_houses_stores_only_cached_listings(
        self,
        mock_fetch,
    ):
        mock_fetch.return_value = (
            [
                {
                    "OpenHouseKey": "OH-1",
                    "ListingKey": "LISTING-1",
                    "ListingId": "MLS-1",
                    "OpenHouseDate": "2026-07-25",
                    "OpenHouseStartTime": "14:00:00",
                    "OpenHouseEndTime": "16:00:00",
                    "OpenHouseRemarks": "Public open house",
                    "OpenHouseType": "Public",
                    "OpenHouseStatus": "Active",
                },
                {
                    "OpenHouseKey": "OH-2",
                    "ListingKey": "NOT-IN-CACHE",
                    "ListingId": "MLS-2",
                    "OpenHouseDate": "2026-07-26",
                    "OpenHouseStartTime": "13:00:00",
                    "OpenHouseEndTime": "15:00:00",
                },
            ],
            1,
        )

        command = Command()

        command.sync_open_houses(
            headers={"Authorization": "Bearer test"},
        )

        self.assertEqual(
            OpenHouse.objects.count(),
            1,
        )

        open_house = OpenHouse.objects.get(
            open_house_key="OH-1",
        )

        self.assertEqual(
            open_house.property,
            self.cached_property,
        )

        self.assertEqual(
            open_house.listing_id,
            "MLS-1",
        )