from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import EstateDocument, EstateDocumentIntent, EstatePrice, EstateProject
from .services.estate_content import parse_estate_content


class EstateParserTests(TestCase):
    def test_extracts_structured_content_and_preserves_prose(self):
        parsed = parse_estate_content("<h2>Overview</h2><p>Carefully preserved prose.</p><h2>Pricing</h2><p>Townhome // From $899,000</p><h2>Deposit Schedule</h2><p>Signing: 5%</p><a href='https://example.com/floor.pdf'>Floor plans</a>")
        self.assertIn("Carefully preserved prose", parsed.sections[0].html)
        self.assertIn(899000, [item.amount for item in parsed.prices])
        self.assertEqual(parsed.deposits[0].percentage, 5)
        self.assertEqual(parsed.documents[0].url, "https://example.com/floor.pdf")

    def test_ambiguous_money_warns_and_is_not_invented(self):
        parsed = parse_estate_content("<h2>Prices</h2><p>$500,000 to $700,000</p>")
        self.assertIsNone(parsed.prices[0].amount)
        self.assertTrue(parsed.warnings)


class EstateApiTests(TestCase):
    def setUp(self):
        self.project = EstateProject.objects.create(source_id="1", title="Example", slug="example", publication_status="publish")
        EstatePrice.objects.create(project=self.project, display_text="From $500,000", amount=500000, currency="CAD")
        self.document = EstateDocument.objects.create(project=self.project, label="Floor plan", document_type="floor_plan", source_url="https://example.com/private.pdf")
        self.user = get_user_model().objects.create_user(email="estate@example.com", password="pass1234", phone="4165550100")
        self.client = APIClient()

    def test_public_detail_is_structured_and_hides_document_url(self):
        response = self.client.get("/api/mls/estate-projects/example/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["prices"][0]["amount"], "500000.00")
        self.assertNotIn("source_url", response.data["documents"][0])

    def test_document_intent_verification_and_access(self):
        self.client.force_authenticate(self.user)
        intent_response = self.client.post(f"/api/mls/estate-documents/{self.document.id}/intent/", {}, format="json")
        intent_id = intent_response.data["intent_id"]
        denied = self.client.post(f"/api/mls/estate-documents/{self.document.id}/access/")
        self.assertEqual(denied.status_code, 403)
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        allowed = self.client.post(f"/api/mls/estate-documents/{self.document.id}/access/")
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(allowed.data["access_url"], "https://example.com/private.pdf")
