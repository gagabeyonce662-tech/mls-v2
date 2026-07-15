from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import connection
from django.test import TransactionTestCase

from .models import (
    EstateContentSection,
    EstateDocument,
    EstateDocumentIntent,
    EstateProject,
    EstateProperty,
    EstateSourceSnapshot,
)
from .services.estate_project_import import EstateProjectImporter


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
            or (
                '<h2>Documents</h2><p><a href="https://example.com/floor.pdf">'
                "Floor plan</a></p>"
            ),
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
        user = get_user_model().objects.create_user(
            email="intent@example.com",
            password="pass1234",
        )
        intent = EstateDocumentIntent.objects.create(
            document=document,
            user=user,
        )

        legacy.wp_meta_json = {"max_garages": 2}
        legacy.save(update_fields=["wp_meta_json"])
        self.run_backfill("--legacy-id", str(legacy.id))

        self.assertEqual(EstateDocument.objects.get().id, document.id)
        self.assertTrue(
            EstateDocumentIntent.objects.filter(
                pk=intent.id,
                document=document,
            ).exists()
        )
        self.assertEqual(EstateDocument.objects.count(), 1)

    def test_rolls_back_only_failed_project(self):
        good = self.legacy("good", "Good", "<h2>Overview</h2><p>Good prose</p>")
        bad = self.legacy("bad", "Bad", "<h2>Overview</h2><p>Bad prose</p>")
        original = EstateProjectImporter._reconcile_children

        def fail_bad(importer, project, *args, **kwargs):
            if project.source_id == "bad":
                raise RuntimeError("parser write failed")
            return original(importer, project, *args, **kwargs)

        with patch.object(
            EstateProjectImporter,
            "_reconcile_children",
            fail_bad,
        ):
            output = self.run_backfill()

        self.assertTrue(
            EstateProject.objects.filter(source_id=good.listing_id).exists()
        )
        self.assertFalse(
            EstateProject.objects.filter(source_id=bad.listing_id).exists()
        )
        self.assertIn("failed=1", output)

    def test_manual_section_is_not_overwritten_or_deleted(self):
        legacy = self.legacy(html="<h2>Overview</h2><p>Imported</p>")
        self.run_backfill("--legacy-id", str(legacy.id))
        project = EstateProject.objects.get()
        manual = EstateContentSection.objects.create(
            project=project,
            heading="Manual",
            html="<p>Keep me</p>",
        )

        legacy.wp_meta_json = {"max_garages": 1}
        legacy.save(update_fields=["wp_meta_json"])
        self.run_backfill("--legacy-id", str(legacy.id))

        manual.refresh_from_db()
        self.assertEqual(manual.html, "<p>Keep me</p>")
