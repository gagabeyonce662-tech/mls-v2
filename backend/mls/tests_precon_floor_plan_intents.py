from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Content, ContentMeta, PreComFloorPlanIntent, PreComProperty


class PreConFloorPlanIntentApiTests(TestCase):
    def setUp(self):
        content = Content.objects.create(
            wp_id=987654,
            content_type=Content.PROPERTY,
            title="Example Towns",
            slug="example-towns",
            status="publish",
        )
        self.property = PreComProperty.objects.create(content=content)
        ContentMeta.objects.create(
            content=content,
            key="floor_plan_url",
            value="https://example.com/floor-plans.pdf",
        )
        self.user = get_user_model().objects.create_user(
            email="buyer@example.com",
            password="pass1234",
            phone="4165550100",
        )
        self.client = APIClient()
        self.url = (
            f"/api/mls/precon-properties/{self.property.id}/floor-plan-intent/"
        )

    def test_requires_authenticated_user(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 401)
        self.assertEqual(PreComFloorPlanIntent.objects.count(), 0)

    def test_requires_phone_verification(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(PreComFloorPlanIntent.objects.count(), 0)

    def test_records_intent_and_returns_server_resolved_url(self):
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["access_url"], "https://example.com/floor-plans.pdf")
        intent = PreComFloorPlanIntent.objects.get(pk=response.data["intent_id"])
        self.assertEqual(intent.property, self.property)
        self.assertEqual(intent.user, self.user)
        self.assertEqual(intent.source_url, response.data["access_url"])

    def test_returns_404_when_floor_plans_are_unavailable(self):
        self.property.content.meta.all().delete()
        self.user.phone_verified = True
        self.user.save(update_fields=["phone_verified"])
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(PreComFloorPlanIntent.objects.count(), 0)


class PreConBulkUploadPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/mls/precon-properties/bulk-upload/"
        self.user = get_user_model().objects.create_user(
            email="editor@example.com",
            password="pass1234",
        )

    def test_anonymous_visitors_cannot_upload(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 401)

    def test_non_staff_users_cannot_upload(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 403)
