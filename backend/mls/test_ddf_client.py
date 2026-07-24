from unittest.mock import Mock, patch

import requests
from django.test import SimpleTestCase

from mls.services.ddf.client import (
    fetch_all_open_houses,
    get_page_with_retries,
    fetch_properties_by_listing_keys,
)

class DDFClientTests(SimpleTestCase):
    @patch("mls.services.ddf.client.time.sleep")
    @patch("mls.services.ddf.client.requests.get")
    def test_retries_timeout_then_returns_successful_response(
        self,
        mock_get,
        mock_sleep,
    ):
        response = Mock(status_code=200)
        mock_get.side_effect = [
            requests.exceptions.ReadTimeout("timed out"),
            response,
        ]

        result = get_page_with_retries(
            "https://example.test/properties",
            headers={"Authorization": "Bearer token"},
            params={"$top": 100},
        )

        self.assertIs(result, response)
        self.assertEqual(mock_get.call_count, 2)
        mock_sleep.assert_called_once_with(1)

    @patch("mls.services.ddf.client.time.sleep")
    @patch("mls.services.ddf.client.requests.get")
    def test_retries_transient_http_error(
        self,
        mock_get,
        mock_sleep,
    ):
        unavailable_response = Mock(status_code=503)
        success_response = Mock(status_code=200)
        mock_get.side_effect = [unavailable_response, success_response]

        result = get_page_with_retries(
            "https://example.test/properties",
            headers={},
            params=None,
        )

        self.assertIs(result, success_response)
        unavailable_response.close.assert_called_once_with()
        mock_sleep.assert_called_once_with(1)
    @patch("mls.services.ddf.client.get_page_with_retries")
    def test_fetch_all_open_houses_follows_next_link(self, mock_get):
        first_response = Mock()
        first_response.json.return_value = {
            "value": [
                {
                    "OpenHouseKey": "OH-1",
                    "ListingKey": "LISTING-1",
                }
            ],
            "@odata.nextLink": "https://example.test/open-houses?page=2",
        }

        second_response = Mock()
        second_response.json.return_value = {
            "value": [
                {
                    "OpenHouseKey": "OH-2",
                    "ListingKey": "LISTING-2",
                }
            ]
        }

        mock_get.side_effect = [
            first_response,
            second_response,
        ]

        results, page_count = fetch_all_open_houses(
            headers={"Authorization": "Bearer token"},
        )

        self.assertEqual(page_count, 2)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["OpenHouseKey"], "OH-1")
        self.assertEqual(results[1]["OpenHouseKey"], "OH-2")

    @patch("mls.services.ddf.client.fetch_all_properties")
    def test_fetch_properties_by_listing_keys_chunks_requests(
        self,
        mock_fetch,
    ):
        mock_fetch.return_value = (
            [{"ListingKey": "TEST"}],
            1,
        )

        listing_keys = [
            str(number)
            for number in range(25)
        ]

        results = fetch_properties_by_listing_keys(
            headers={"Authorization": "Bearer token"},
            listing_keys=listing_keys,
        )

        self.assertEqual(mock_fetch.call_count, 2)
        self.assertEqual(len(results), 2)