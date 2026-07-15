from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.core import signing
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import (
    EstateDocument,
    EstateDocumentIntent,
    EstateProject,
)


class EstateDocumentApiTests(TestCase):
    def setUp(self):
        self.project = EstateProject.objects.create(
            source_id="1",
            title="Example",
            slug="example",
            publication_status="publish",
        )
        self.document = EstateDocument.objects.create(
            project=self.project,
            label="Floor plan",
            document_type="floor_plan",
            source_url="https://example.com/private.pdf",
        )
        self.user = get_user_model().objects.create_user(
            email="estate@example.com",
            password="pass1234",
            phone="4165550100",
        )
        self.client = APIClient()

    def test_draft_project_documents_return_404(self):
        self.project.publication_status = "draft"
        self.project.save(update_fields=["publication_status"])
        self.client.force_authenticate(self.user)

        intent = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/intent/",
            {},
        )
        access = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )

        self.assertEqual(intent.status_code, 404)
        self.assertEqual(access.status_code, 404)

    def test_missing_documents_return_404(self):
        self.client.force_authenticate(self.user)

        intent = self.client.post(
            "/api/mls/estate-documents/999999/intent/",
            {},
        )
        access = self.client.post(
            "/api/mls/estate-documents/999999/access/"
        )

        self.assertEqual(intent.status_code, 404)
        self.assertEqual(access.status_code, 404)

    def test_document_access_requires_intent_and_verified_phone(self):
        self.client.force_authenticate(self.user)
        no_intent = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )
        self.assertEqual(no_intent.status_code, 403)

        intent_response = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/intent/",
            {"phone": self.user.phone},
            format="json",
        )
        self.assertEqual(intent_response.status_code, 201)
        unverified = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )
        self.assertEqual(unverified.status_code, 403)

        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        allowed = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )

        self.assertEqual(allowed.status_code, 200)
        self.assertIn(
            "/api/mls/estate-documents/proxy/?token=",
            allowed.data["access_url"],
        )
        self.assertNotIn(self.document.source_url, allowed.data["access_url"])

    def test_verified_account_intent_uses_registered_phone(self):
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        self.client.force_authenticate(self.user)

        response = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/intent/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        intent = EstateDocumentIntent.objects.get(pk=response.data["intent_id"])
        self.assertEqual(intent.phone, self.user.phone)
        access = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )
        self.assertEqual(access.status_code, 200)

    def test_verified_account_cannot_submit_different_phone(self):
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        self.client.force_authenticate(self.user)

        response = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/intent/",
            {"phone": "6475550199"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(EstateDocumentIntent.objects.exists())

    def test_account_phone_changed_without_verification_is_blocked(self):
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        self.client.force_authenticate(self.user)
        intent = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/intent/",
            {},
            format="json",
        )
        self.assertEqual(intent.status_code, 201)

        profile = self.client.put(
            "/api/auth/profile/",
            {"phone": "6475550199"},
            format="json",
        )
        self.assertEqual(profile.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.phone_verified)

        access = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )
        self.assertEqual(access.status_code, 403)

    def test_unverified_account_remains_blocked(self):
        self.client.force_authenticate(self.user)
        intent = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/intent/",
            {"phone": self.user.phone},
            format="json",
        )
        self.assertEqual(intent.status_code, 201)

        access = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )

        self.assertEqual(access.status_code, 403)

    @override_settings(ESTATE_DOCUMENT_ALLOWED_HOSTS=["example.com"])
    def test_signed_proxy_streams_allowlisted_document(self):
        self.client.force_authenticate(self.user)
        self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/intent/",
            {"phone": self.user.phone},
        )
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        access = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )
        token = access.data["access_url"].split("token=", 1)[1]
        upstream = self._upstream_response()

        with patch(
            "mls.services.estate_documents.requests.get",
            return_value=upstream,
        ):
            response = self.client.get(
                f"/api/mls/estate-documents/proxy/?token={token}"
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(b"".join(response.streaming_content), b"data")

        upstream.close.assert_called_once()

    @override_settings(ESTATE_DOCUMENT_ALLOWED_HOSTS=["example.com"])
    def test_non_verification_document_streams_without_verified_intent(self):
        document = EstateDocument.objects.create(
            project=self.project,
            label="Public brochure",
            document_type="brochure",
            source_url="https://example.com/public.pdf",
            requires_phone_verification=False,
        )
        self.client.force_authenticate(self.user)
        intent_response = self.client.post(
            f"/api/mls/estate-documents/{document.id}/intent/",
            {},
            format="json",
        )
        self.assertEqual(intent_response.status_code, 201)
        intent = EstateDocumentIntent.objects.get(
            pk=intent_response.data["intent_id"]
        )
        self.assertIsNone(intent.verified_at)

        access = self.client.post(
            f"/api/mls/estate-documents/{document.id}/access/"
        )
        self.assertEqual(access.status_code, 200)
        token = access.data["access_url"].split("token=", 1)[1]
        upstream = self._upstream_response()

        with patch(
            "mls.services.estate_documents.requests.get",
            return_value=upstream,
        ):
            response = self.client.get(
                f"/api/mls/estate-documents/proxy/?token={token}"
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(b"".join(response.streaming_content), b"data")

        intent.refresh_from_db()
        self.assertIsNone(intent.verified_at)
        upstream.close.assert_called_once()

    def test_invalid_proxy_token_returns_404(self):
        response = self.client.get(
            "/api/mls/estate-documents/proxy/?token=invalid"
        )

        self.assertEqual(response.status_code, 404)

    def test_proxy_token_is_bound_to_exact_intent_document_and_user(self):
        self.document.requires_phone_verification = False
        self.document.save(update_fields=["requires_phone_verification"])
        self.client.force_authenticate(self.user)
        intent_response = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/intent/",
            {},
        )
        access = self.client.post(
            f"/api/mls/estate-documents/{self.document.id}/access/"
        )
        token = access.data["access_url"].split("token=", 1)[1]
        payload = signing.loads(token, salt="estate-document-access")

        self.assertEqual(payload["intent_id"], intent_response.data["intent_id"])
        self.assertEqual(payload["document_id"], self.document.id)
        self.assertEqual(payload["user_id"], self.user.id)

        other_document = EstateDocument.objects.create(
            project=self.project,
            label="Other",
            document_type="other",
            source_url="https://example.com/other.pdf",
            requires_phone_verification=False,
        )
        payload["document_id"] = other_document.id
        mismatched_token = signing.dumps(
            payload,
            salt="estate-document-access",
        )

        response = self.client.get(
            f"/api/mls/estate-documents/proxy/?token={mismatched_token}"
        )
        self.assertEqual(response.status_code, 404)

    @staticmethod
    def _upstream_response():
        upstream = Mock(
            status_code=200,
            headers={
                "Content-Type": "application/pdf",
                "Content-Length": "4",
            },
        )
        upstream.iter_content.return_value = [b"data"]
        return upstream
