"""
Unit tests for the accounts app — covers email verification flow plus existing
OAuth and OTP tests, updated for is_active=False default.
"""

import uuid
from datetime import timedelta
from unittest.mock import MagicMock, patch

import requests
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import EmailVerificationToken

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _active_user(**kwargs):
    """Create a user with is_active=True (overriding the model default)."""
    kwargs.setdefault("is_active", True)
    return User.objects.create_user(**kwargs)


# ---------------------------------------------------------------------------
# Registration & Email Verification
# ---------------------------------------------------------------------------

class RegisterViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("accounts.views._send_verification_email")
    @patch("accounts.views.create_ghl_contact", return_value="ghl_123")
    def test_register_creates_inactive_user_and_fires_email_task(self, _ghl, mock_send):
        r = self.client.post(
            "/api/auth/register/",
            {
                "name": "Alice Smith",
                "email": "alice@example.com",
                "password": "StrongP@ss1",
                "phone": "+15551234567",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertIn("detail", r.data)

        user = User.objects.get(email="alice@example.com")
        self.assertFalse(user.is_active, "New user must be inactive until email verified")
        self.assertEqual(user.ghl_contact_id, "ghl_123")

        token_obj = EmailVerificationToken.objects.get(user=user)
        mock_send.assert_called_once_with(user.id, str(token_obj.token))

    @patch("accounts.views._send_verification_email")
    @patch("accounts.views.create_ghl_contact", return_value=None)
    def test_register_duplicate_email_rejected(self, _ghl, _send):
        _active_user(email="dup@example.com", password="pass123456", first_name="Dup")
        r = self.client.post(
            "/api/auth/register/",
            {"name": "Dup", "email": "dup@example.com", "password": "StrongP@ss1", "phone": "+1"},
            format="json",
        )
        self.assertEqual(r.status_code, 400)


class VerifyEmailViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="verify@example.com",
            password="secret12345",
            first_name="Verify",
            is_active=False,
        )

    def _make_token(self, hours_offset=0):
        token_obj = EmailVerificationToken(user=self.user)
        token_obj.expires_at = timezone.now() + timedelta(hours=24 + hours_offset)
        token_obj.save()
        return token_obj

    def test_valid_token_activates_user_and_returns_jwt(self):
        token_obj = self._make_token()
        r = self.client.get(f"/api/auth/verify-email/{token_obj.token}/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)
        self.assertFalse(EmailVerificationToken.objects.filter(pk=token_obj.pk).exists())

    def test_expired_token_returns_410(self):
        token_obj = EmailVerificationToken(user=self.user)
        token_obj.expires_at = timezone.now() - timedelta(seconds=1)
        token_obj.save()

        r = self.client.get(f"/api/auth/verify-email/{token_obj.token}/")
        self.assertEqual(r.status_code, 410)
        self.assertTrue(r.data.get("resend_required"))

    def test_invalid_token_returns_404(self):
        r = self.client.get(f"/api/auth/verify-email/{uuid.uuid4()}/")
        self.assertEqual(r.status_code, 404)

    def test_token_deleted_after_use(self):
        token_obj = self._make_token()
        self.client.get(f"/api/auth/verify-email/{token_obj.token}/")
        # Second use should 404 (token deleted)
        r = self.client.get(f"/api/auth/verify-email/{token_obj.token}/")
        self.assertEqual(r.status_code, 404)


class ResendVerificationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="resend@example.com",
            password="secret12345",
            first_name="Resend",
            is_active=False,
        )

    @patch("accounts.views._send_verification_email")
    def test_resend_creates_new_token_and_fires_task(self, mock_send):
        # Create an old token first
        old = EmailVerificationToken.objects.create(user=self.user)
        old_token = old.token

        r = self.client.post(
            "/api/auth/resend-verification/",
            {"email": "resend@example.com"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        # Old token deleted, new one created
        self.assertFalse(EmailVerificationToken.objects.filter(token=old_token).exists())
        new_obj = EmailVerificationToken.objects.get(user=self.user)
        mock_send.assert_called_once_with(self.user.id, str(new_obj.token))

    @patch("accounts.views._send_verification_email")
    def test_resend_for_unknown_email_returns_200(self, mock_send):
        """No user enumeration — always 200."""
        r = self.client.post(
            "/api/auth/resend-verification/",
            {"email": "nobody@example.com"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        mock_send.assert_not_called()

    @patch("accounts.views._send_verification_email")
    def test_resend_rate_limit(self, mock_send):
        """After 3 resends, further requests are silently dropped (still 200)."""
        for _ in range(3):
            self.client.post(
                "/api/auth/resend-verification/",
                {"email": "resend@example.com"},
                format="json",
            )
        # 4th attempt
        r = self.client.post(
            "/api/auth/resend-verification/",
            {"email": "resend@example.com"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        # Sent at most 3 times
        self.assertLessEqual(mock_send.call_count, 3)


# ---------------------------------------------------------------------------
# Login: inactive user gets 403 with helpful message
# ---------------------------------------------------------------------------

class LoginViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_login_with_unverified_account_returns_403(self):
        User.objects.create_user(
            email="inactive@example.com",
            password="secret12345",
            first_name="Inactive",
            is_active=False,
        )
        r = self.client.post(
            "/api/auth/login/",
            {"email": "inactive@example.com", "password": "secret12345"},
            format="json",
        )
        self.assertEqual(r.status_code, 403)
        self.assertIn("verify", r.data.get("detail", "").lower())

    def test_login_with_wrong_password_returns_401(self):
        _active_user(email="active@example.com", password="secret12345", first_name="Active")
        r = self.client.post(
            "/api/auth/login/",
            {"email": "active@example.com", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(r.status_code, 401)

    def test_login_with_verified_account_returns_tokens(self):
        _active_user(email="ok@example.com", password="secret12345", first_name="OK")
        r = self.client.post(
            "/api/auth/login/",
            {"email": "ok@example.com", "password": "secret12345"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)


# ---------------------------------------------------------------------------
# Facebook OAuth — new user is immediately active
# ---------------------------------------------------------------------------

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
    def test_facebook_login_creates_new_user_active(self, mock_get, _ghl):
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
        self.assertTrue(u.is_active, "OAuth users must be active immediately")

    @patch("accounts.views.create_ghl_contact", return_value=None)
    @patch("accounts.views.requests.get")
    def test_facebook_login_links_existing_email_user(self, mock_get, _ghl):
        # User exists but is inactive (pending email verify) — FB login should activate.
        User.objects.create_user(
            email="link@example.com",
            password="secret12345",
            first_name="Old",
            is_active=False,
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
        self.assertTrue(existing.is_active)

    @patch("accounts.views.create_ghl_contact", return_value=None)
    @patch("accounts.views.requests.get")
    def test_facebook_login_idempotent_for_existing_facebook_id(
        self, mock_get, _ghl
    ):
        u = _active_user(email="f@example.com", password="secret12345", first_name="F")
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


# ---------------------------------------------------------------------------
# Phone OTP
# ---------------------------------------------------------------------------

class PhoneOtpViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = _active_user(
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
        # Message clearly indicates service misconfiguration
        self.assertIn("service", str(r.data.get("detail", "")).lower())

    @override_settings(
        FACEBOOK_APP_ID="test_app_id",
        FACEBOOK_APP_SECRET="test_secret",
        FACEBOOK_REDIRECT_URI="http://localhost:3000/auth/facebook/callback",
        FACEBOOK_ALLOWED_REDIRECT_URIS="",
        FACEBOOK_GRAPH_VERSION="v19.0",
    )
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

    @override_settings(
        FACEBOOK_APP_ID="test_app_id",
        FACEBOOK_APP_SECRET="test_secret",
        FACEBOOK_REDIRECT_URI="http://localhost:3000/auth/facebook/callback",
        FACEBOOK_ALLOWED_REDIRECT_URIS="",
        FACEBOOK_GRAPH_VERSION="v19.0",
    )
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
