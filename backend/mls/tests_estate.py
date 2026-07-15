from io import StringIO
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import connection
from django.test import TestCase, TransactionTestCase, override_settings
from rest_framework.test import APIClient

from .management.commands.backfill_estate_projects import Command
from .models import (
    EstateContentSection,
    EstateDocument,
    EstateDocumentIntent,
    EstatePrice,
    EstateProject,
    EstateProperty,
    EstateSourceSnapshot,
)
from .services.estate_content import parse_estate_content


class EstateParserTests(TestCase):
    def test_preserves_residual_rich_html_exactly(self):
        rich_html = (
            '<h2 data-id="overview">Overview</h2>'
            '<p class="lead">Text <strong>bold</strong> '
            '<a href="https://example.com/about">link</a>.</p>'
            '<ul class="features"><li>First</li><li><em>Second</em></li></ul>'
            '<table><tr><th>Label</th><td>Value</td></tr></table>'
        )
        parsed = parse_estate_content(rich_html)
        self.assertEqual(
            parsed.sections[0].html,
            rich_html[rich_html.index("<p"):],
        )

    def test_uses_metadata_and_taxonomies_as_supporting_inputs(self):
        parsed = parse_estate_content(
            "<p>Overview</p>",
            {"fave_property_price": "$899,000"},
            {"type": ["Townhomes"], "features": ["Closing credit"]},
        )
        self.assertEqual(parsed.unit_types[0].text, "Townhomes")
        self.assertEqual(parsed.prices[0].amount, 899000)
        self.assertEqual(parsed.incentives[0].text, "Closing credit")

    def test_groups_deposit_installments_under_one_plan(self):
        parsed = parse_estate_content(
            "<h2>Deposit Schedule</h2><ul>"
            "<li>Signing: 5%</li><li>30 days: $25,000</li></ul>"
        )
        self.assertEqual(len(parsed.deposit_plans), 1)
        self.assertEqual(len(parsed.deposit_plans[0].installments), 2)
        self.assertEqual(parsed.deposit_plans[0].installments[0].percentage, 5)

    def test_warns_and_preserves_ambiguous_content(self):
        parsed = parse_estate_content(
            "<h2>Pricing</h2><p>$500,000 to $700,000</p>"
            "<h2>Deposit Schedule</h2><p>Contact us for details</p>"
        )
        self.assertIsNone(parsed.prices[0].amount)
        self.assertTrue(any("Ambiguous price" in warning for warning in parsed.warnings))
        self.assertTrue(any("Ambiguous or unsupported deposits" in warning for warning in parsed.warnings))
        self.assertIn("Contact us for details", parsed.sections[0].html)


class EstateBackfillTests(TransactionTestCase):
    reset_sequences = True
    _created_legacy_table = False

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if EstateProperty._meta.db_table not in connection.introspection.table_names():
            with connection.schema_editor() as editor:
                editor.create_model(EstateProperty)
            cls._created_legacy_table = True

    @classmethod
    def tearDownClass(cls):
        if cls._created_legacy_table:
            with connection.schema_editor() as editor:
                editor.delete_model(EstateProperty)
        super().tearDownClass()

    def setUp(self):
        EstateProperty.objects.all().delete()

    def legacy(self, key="legacy-1", title="Example", html=None):
        return EstateProperty.objects.create(
            listing_key=key,
            listing_id=key,
            property_title=title,
            property_slug=key,
            publish_status="publish",
            property_description=html
            or '<h2>Documents</h2><p><a href="https://example.com/floor.pdf">Floor plan</a></p>',
            wp_meta_json={},
            wp_terms_json={"type": ["Townhomes"]},
            wp_post_json={},
        )

    def run_backfill(self, *args):
        stdout = StringIO()
        call_command("backfill_estate_projects", *args, stdout=stdout)
        return stdout.getvalue()

    def test_dry_run_rolls_back_everything(self):
        legacy = self.legacy()
        output = self.run_backfill("--dry-run", "--legacy-id", str(legacy.id))
        self.assertIn("created=1", output)
        self.assertFalse(EstateProject.objects.exists())
        self.assertFalse(EstateSourceSnapshot.objects.exists())

    def test_idempotency_preserves_document_ids_and_intents(self):
        legacy = self.legacy()
        self.run_backfill("--legacy-id", str(legacy.id))
        document = EstateDocument.objects.get()
        user = get_user_model().objects.create_user(email="intent@example.com", password="pass1234")
        intent = EstateDocumentIntent.objects.create(document=document, user=user)

        legacy.wp_meta_json = {"max_garages": 2}
        legacy.save(update_fields=["wp_meta_json"])
        self.run_backfill("--legacy-id", str(legacy.id))

        self.assertEqual(EstateDocument.objects.get().id, document.id)
        self.assertTrue(EstateDocumentIntent.objects.filter(pk=intent.id, document=document).exists())
        self.assertEqual(EstateDocument.objects.count(), 1)

    def test_rolls_back_only_failed_project(self):
        good = self.legacy("good", "Good", "<h2>Overview</h2><p>Good prose</p>")
        bad = self.legacy("bad", "Bad", "<h2>Overview</h2><p>Bad prose</p>")
        original = Command._reconcile_children

        def fail_bad(command, project, *args, **kwargs):
            if project.source_id == "bad":
                raise RuntimeError("parser write failed")
            return original(command, project, *args, **kwargs)

        with patch.object(Command, "_reconcile_children", fail_bad):
            output = self.run_backfill()
        self.assertTrue(EstateProject.objects.filter(source_id=good.listing_id).exists())
        self.assertFalse(EstateProject.objects.filter(source_id=bad.listing_id).exists())
        self.assertIn("failed=1", output)

    def test_manual_section_is_not_overwritten_or_deleted(self):
        legacy = self.legacy(html="<h2>Overview</h2><p>Imported</p>")
        self.run_backfill("--legacy-id", str(legacy.id))
        project = EstateProject.objects.get()
        manual = EstateContentSection.objects.create(project=project, heading="Manual", html="<p>Keep me</p>")
        legacy.wp_meta_json = {"max_garages": 1}
        legacy.save(update_fields=["wp_meta_json"])
        self.run_backfill("--legacy-id", str(legacy.id))
        manual.refresh_from_db()
        self.assertEqual(manual.html, "<p>Keep me</p>")


class EstateApiTests(TestCase):
    def setUp(self):
        self.project = EstateProject.objects.create(
            source_id="1",
            title="Example",
            slug="example",
            publication_status="publish",
        )
        EstatePrice.objects.create(
            project=self.project,
            display_text="From $500,000",
            amount=500000,
            currency="CAD",
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

    def test_public_detail_is_structured_and_never_exposes_source_url(self):
        response = self.client.get("/api/mls/estate-projects/example/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["prices"][0]["amount"], "500000.00")
        self.assertNotIn("source_url", response.data["documents"][0])
        self.assertNotIn("https://example.com/private.pdf", str(response.data))
        self.assertNotIn("source_id", response.data)
        self.assertNotIn("source_snapshot", response.data)

    def test_draft_project_and_documents_return_404(self):
        self.project.publication_status = "draft"
        self.project.save(update_fields=["publication_status"])
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get("/api/mls/estate-projects/example/").status_code, 404)
        self.assertEqual(self.client.post(f"/api/mls/estate-documents/{self.document.id}/intent/", {}).status_code, 404)
        self.assertEqual(self.client.post(f"/api/mls/estate-documents/{self.document.id}/access/").status_code, 404)

    def test_missing_documents_return_404(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post("/api/mls/estate-documents/999999/intent/", {}).status_code, 404)
        self.assertEqual(self.client.post("/api/mls/estate-documents/999999/access/").status_code, 404)

    def test_document_access_requires_intent_and_verified_phone(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post(f"/api/mls/estate-documents/{self.document.id}/access/").status_code, 403)
        intent_response = self.client.post(f"/api/mls/estate-documents/{self.document.id}/intent/", {}, format="json")
        self.assertEqual(intent_response.status_code, 201)
        self.assertEqual(self.client.post(f"/api/mls/estate-documents/{self.document.id}/access/").status_code, 403)
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        allowed = self.client.post(f"/api/mls/estate-documents/{self.document.id}/access/")
        self.assertEqual(allowed.status_code, 200)
        self.assertIn("/api/mls/estate-documents/proxy/?token=", allowed.data["access_url"])
        self.assertNotIn(self.document.source_url, allowed.data["access_url"])

    @override_settings(ESTATE_DOCUMENT_ALLOWED_HOSTS=["example.com"])
    def test_signed_proxy_streams_allowlisted_document(self):
        self.client.force_authenticate(self.user)
        self.client.post(f"/api/mls/estate-documents/{self.document.id}/intent/", {})
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        access = self.client.post(f"/api/mls/estate-documents/{self.document.id}/access/")
        token = access.data["access_url"].split("token=", 1)[1]
        upstream = Mock(
            status_code=200,
            headers={"Content-Type": "application/pdf", "Content-Length": "4"},
        )
        upstream.iter_content.return_value = [b"data"]
        with patch("mls.views_estate.requests.get", return_value=upstream):
            response = self.client.get(f"/api/mls/estate-documents/proxy/?token={token}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(b"".join(response.streaming_content), b"data")
        upstream.close.assert_called_once()

    def test_invalid_proxy_token_returns_404(self):
        self.assertEqual(self.client.get("/api/mls/estate-documents/proxy/?token=invalid").status_code, 404)
