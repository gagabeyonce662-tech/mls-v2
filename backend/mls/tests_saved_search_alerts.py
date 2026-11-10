"""Saved-search alert scheduling and composition. SimpleTestCase: no database."""
from datetime import datetime, timedelta, timezone as dt_timezone
from types import SimpleNamespace

from django.test import SimpleTestCase

from mls.models import SavedSearch
from mls.services import saved_search_alerts as alerts

NOW = datetime(2026, 9, 25, 12, 30, tzinfo=dt_timezone.utc)


def search(**overrides):
    base = dict(
        pk=1,
        name="Brampton detached",
        alert_cadence=SavedSearch.ALERT_DAILY,
        last_run_at=None,
        created_at=NOW - timedelta(days=30),
        filters_json={},
        user=SimpleNamespace(full_name="Sam", email="sam@example.com"),
    )
    base.update(overrides)
    return SimpleNamespace(**base)


class DueTests(SimpleTestCase):
    def test_off_is_never_due(self):
        self.assertFalse(alerts.is_due(search(alert_cadence=SavedSearch.ALERT_OFF), NOW))

    def test_never_run_is_due(self):
        self.assertTrue(alerts.is_due(search(), NOW))

    def test_daily_waits_about_a_day(self):
        self.assertFalse(alerts.is_due(search(last_run_at=NOW - timedelta(hours=5)), NOW))
        self.assertTrue(alerts.is_due(search(last_run_at=NOW - timedelta(hours=23, minutes=55)), NOW))

    def test_weekly_waits_about_a_week(self):
        weekly = SavedSearch.ALERT_WEEKLY
        self.assertFalse(alerts.is_due(search(alert_cadence=weekly, last_run_at=NOW - timedelta(days=3)), NOW))
        self.assertTrue(alerts.is_due(search(alert_cadence=weekly, last_run_at=NOW - timedelta(days=7)), NOW))


class WindowTests(SimpleTestCase):
    def test_continues_from_last_check(self):
        last = NOW - timedelta(hours=24)
        self.assertEqual(alerts.check_window_start(search(last_run_at=last), NOW), last)

    def test_first_run_looks_back_one_cadence_but_not_before_creation(self):
        self.assertEqual(alerts.check_window_start(search(), NOW), NOW - timedelta(days=1))
        fresh = search(created_at=NOW - timedelta(hours=2))
        self.assertEqual(alerts.check_window_start(fresh, NOW), NOW - timedelta(hours=2))


class ReplayParamsTests(SimpleTestCase):
    def test_strict_newest_first_and_lists_repeat(self):
        params = alerts.replay_params(
            {"city": "Brampton", "property_sub_type": ["Detached", "Semi-Detached"], "limit": 12, "allow_fallback": "true", "price_max": ""},
            NOW,
        )
        self.assertEqual(params["city"], "Brampton")
        self.assertEqual(params.getlist("property_sub_type"), ["Detached", "Semi-Detached"])
        self.assertEqual(params["allow_fallback"], "false")
        self.assertEqual(params["limit"], str(alerts.REPLAY_LIMIT))
        self.assertEqual(params["modified_since"], NOW.isoformat())
        self.assertNotIn("price_max", params)


class ComposeTests(SimpleTestCase):
    def test_lists_matches_and_caps_the_email(self):
        rows = [
            {"listing_key": f"W{i}", "unparsed_address": f"{i} Main St", "list_price": "999000"}
            for i in range(12)
        ]
        subject, body = alerts.compose_alert(search(), rows)
        self.assertEqual(subject, '12 new homes for "Brampton detached"')
        self.assertIn("0 Main St | $999,000 |", body)
        self.assertIn("/property/W0", body)
        self.assertIn("...and 2 more.", body)
        self.assertIn("watched?tab=saved-search", body)

    def test_singular_subject(self):
        subject, _ = alerts.compose_alert(search(), [{"listing_key": "W1"}])
        self.assertEqual(subject, '1 new home for "Brampton detached"')
