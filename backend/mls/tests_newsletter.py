"""Daily digest composition. SimpleTestCase: no database."""
from datetime import datetime

from django.test import SimpleTestCase


class DigestComposeTests(SimpleTestCase):
    def test_change_sections_render_and_skip_empty(self):
        from mls.services.newsletter_notifications import _compose_email

        changes = {
            "price_changes": [{"listing_key": "W1", "old": 1_000_000.0, "new": 950_000.0, "property": None}],
        }
        subject, body = _compose_email("Sam", {}, datetime(2026, 9, 25).date(), changes)
        self.assertIn("2026-09-25", subject)
        self.assertIn("Price changes on your saved homes (1):", body)
        self.assertIn("$1,000,000 -> $950,000", body)
        self.assertNotIn("Status changes", body)
