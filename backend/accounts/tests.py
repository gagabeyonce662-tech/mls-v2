from unittest.mock import MagicMock, patch

import requests
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

User = get_user_model()


@override_settings(
    FACEBOOK_APP_ID="test_app_id",
    FACEBOOK_APP_SECRET="test_secret",
    FACEBOOK_REDIRECT_URI="http://localhost:3000/auth/facebook/callback",
    FACEBOOK_ALLOWED_REDIRECT_URIS="",
    FACEBOOK_GRAPH_VERSION="v19.0",
)
class FacebookAuthViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _mock_graph_chain(self, mock_get, me_payload, token_payload=None):
        if token_payload is None:
            token_payload = {"access_token": "EA_test"}

        def side_effect(url, params=None, timeout=None, **kwargs):
            u = str(url)
            m = MagicMock()
            if "oauth/access_token" in u:
                m.json.return_value = token_payload
                m.raise_for_status = MagicMock()
                return m
            if "/me" in u:
                m.json.return_value = me_payload
                m.raise_for_status = MagicMock()
                return m
            raise AssertionError(f"unexpected url {u}")

        mock_get.side_effect = side_effect

    @patch("accounts.views.create_ghl_contact", return_value=None)
    @patch("accounts.views.requests.get")
    def test_facebook_login_creates_new_user(self, mock_get, _ghl):
        self._mock_graph_chain(
            mock_get,
            {
                "id": "fb_xyz",
                "email": "brand_new@example.com",
                "first_name": "Jane",
                "last_name": "Doe",
            },
        )
        r = self.client.post(
            "/api/auth/facebook/",
            {
                "code": "valid_code",
                "redirect_uri": "http://localhost:3000/auth/facebook/callback",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)
        u = User.objects.get(email="brand_new@example.com")
        self.assertEqual(u.facebook_id, "fb_xyz")

    @patch("accounts.views.create_ghl_contact", return_value=None)
    @patch("accounts.views.requests.get")
    def test_facebook_login_links_existing_email_user(self, mock_get, _ghl):
        User.objects.create_user(
            email="link@example.com",
            password="secret12345",
            first_name="Old",
        )
        self._mock_graph_chain(
            mock_get,
            {
                "id": "fb_link",
                "email": "link@example.com",
                "first_name": "Old",
                "last_name": "User",
            },
        )
        r = self.client.post(
            "/api/auth/facebook/",
            {
                "code": "valid_code",
                "redirect_uri": "http://localhost:3000/auth/facebook/callback",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        existing = User.objects.get(email="link@example.com")
        self.assertEqual(existing.facebook_id, "fb_link")

    @patch("accounts.views.create_ghl_contact", return_value=None)
    @patch("accounts.views.requests.get")
    def test_facebook_login_idempotent_for_existing_facebook_id(
        self, mock_get, _ghl
    ):
        u = User.objects.create_user(
            email="f@example.com", password="secret12345", first_name="F"
        )
        u.facebook_id = "fb_same"
        u.save(update_fields=["facebook_id"])
        self._mock_graph_chain(
            mock_get,
            {
                "id": "fb_same",
                "email": "f@example.com",
                "first_name": "F",
                "last_name": "",
            },
        )
        r = self.client.post(
            "/api/auth/facebook/",
            {
                "code": "valid_code",
                "redirect_uri": "http://localhost:3000/auth/facebook/callback",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(User.objects.filter(email="f@example.com").count(), 1)

    @patch("accounts.views.requests.get")
    def test_facebook_login_rejects_missing_email(self, mock_get):
        self._mock_graph_chain(
            mock_get,
            {"id": "fb_no_email", "first_name": "X", "last_name": ""},
        )
        r = self.client.post(
            "/api/auth/facebook/",
            {
                "code": "valid_code",
                "redirect_uri": "http://localhost:3000/auth/facebook/callback",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 400)


class PhoneOtpViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="otp@example.com",
            password="secret12345",
            first_name="Otp",
        )
        self.client.force_authenticate(self.user)

    @override_settings(
        TWILIO_ACCOUNT_SID="",
        TWILIO_AUTH_TOKEN="",
        TWILIO_VERIFY_SERVICE_SID="",
    )
    def test_send_otp_returns_controlled_503_when_twilio_is_not_configured(self):
        with self.assertLogs("accounts.views", level="ERROR") as logs:
            r = self.client.post(
                "/api/auth/send-otp/",
                {"phone": "+15555550123"},
                format="json",
            )

        self.assertEqual(r.status_code, 503)
        self.assertEqual(r.data.get("detail"), "SMS service is not configured.")
        self.assertIn("TWILIO_ACCOUNT_SID", "\n".join(logs.output))
        self.assertIn("TWILIO_AUTH_TOKEN", "\n".join(logs.output))
        self.assertIn("TWILIO_VERIFY_SERVICE_SID", "\n".join(logs.output))
        self.assertIn("email", str(r.data.get("detail", "")).lower())

    @patch("accounts.views.requests.get")
    def test_facebook_login_rejects_invalid_code(self, mock_get):
        def side_effect(url, params=None, timeout=None, **kwargs):
            u = str(url)
            if "oauth/access_token" in u:
                m = MagicMock()
                m.json.return_value = {
                    "error": {"message": "Invalid verification code format."}
                }
                m.raise_for_status = MagicMock()
                return m
            raise AssertionError("should not reach /me")

        mock_get.side_effect = side_effect
        r = self.client.post(
            "/api/auth/facebook/",
            {
                "code": "bad",
                "redirect_uri": "http://localhost:3000/auth/facebook/callback",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    @override_settings(
        FACEBOOK_APP_ID="test_app_id",
        FACEBOOK_APP_SECRET="test_secret",
        FACEBOOK_REDIRECT_URI="http://localhost:3000/auth/facebook/callback",
    )
    def test_facebook_login_rejects_invalid_redirect_uri(self):
        r = self.client.post(
            "/api/auth/facebook/",
            {
                "code": "x",
                "redirect_uri": "https://evil.com/cb",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.data.get("detail"), "Invalid redirect_uri.")

    @patch("accounts.views.requests.get")
    def test_facebook_login_http_error_on_token_exchange(self, mock_get):
        mock_get.side_effect = requests.RequestException("network down")
        r = self.client.post(
            "/api/auth/facebook/",
            {
                "code": "any",
                "redirect_uri": "http://localhost:3000/auth/facebook/callback",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 400)
