import os

from django.test import TestCase

from homepage.runtime_config import invalidate, public_payload, save_values, staff_payload, stored_values


class IntegrationSettingsTests(TestCase):
    def tearDown(self):
        os.environ.pop("SENDGRID_API_KEY", None)
        os.environ.pop("GOOGLE_CLIENT_ID", None)
        invalidate()

    def test_staff_sees_the_current_secret_and_the_public_site_does_not(self):
        save_values({"sendgridApiKey": "secret-value", "googleClientId": "google-id"})
        staff = staff_payload()
        sendgrid = next(field for field in staff["fields"] if field["key"] == "sendgridApiKey")
        self.assertEqual(sendgrid["value"], "secret-value")
        names = {field["env"] for field in staff["fields"]}
        self.assertIn("SECRET_KEY", names)
        self.assertIn("DATABASE_URL", names)
        self.assertIn("DEBUG", names)
        self.assertIn("OPENAI_BASE_URL", names)
        self.assertIn("SOLD_TRENDS_WARM_BEAT_ENABLED", names)
        self.assertIn("SMOKE_TEST_PASSWORD", names)
        built_in = next(field for field in staff["fields"] if field["key"] == "recWeightContent")
        self.assertEqual(built_in["value"], "0.55")
        payload = public_payload()
        self.assertEqual(payload["googleClientId"], "google-id")
        self.assertNotIn("sendgridApiKey", payload)

    def test_clearing_a_secret_removes_the_saved_copy(self):
        save_values({"sendgridApiKey": "secret-value"})
        save_values({"sendgridApiKey": ""})
        self.assertNotIn("sendgridApiKey", stored_values())

    def test_clear_removes_a_saved_secret(self):
        save_values({"sendgridApiKey": "secret-value"})
        save_values({}, ["sendgridApiKey"])
        self.assertNotIn("sendgridApiKey", stored_values())
