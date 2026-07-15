from django.test import TestCase
from rest_framework.test import APIClient

from .models import EstateDocument, EstatePrice, EstateProject


class EstateProjectApiTests(TestCase):
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
        self.client = APIClient()

    def test_public_detail_is_structured_and_never_exposes_source_url(self):
        response = self.client.get("/api/mls/estate-projects/example/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["prices"][0]["amount"], "500000.00")
        self.assertNotIn("source_url", response.data["documents"][0])
        self.assertNotIn("https://example.com/private.pdf", str(response.data))
        self.assertNotIn("source_id", response.data)
        self.assertNotIn("source_snapshot", response.data)

    def test_list_includes_the_lowest_real_price_without_extra_queries(self):
        EstatePrice.objects.create(
            project=self.project,
            display_text="From $650,000",
            amount=650000,
            currency="CAD",
        )

        with self.assertNumQueries(1):
            response = self.client.get("/api/mls/estate-projects/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["lowest_price_display"], "From $500,000")

    def test_draft_project_returns_404(self):
        self.project.publication_status = "draft"
        self.project.save(update_fields=["publication_status"])

        response = self.client.get("/api/mls/estate-projects/example/")

        self.assertEqual(response.status_code, 404)
