"""Assistant, pre-con activity, push storage and CRM lead tagging."""

import os
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from mls.models import Content, PreconActivityEvent, PropertyInquiry
from mls.services.ai_assist import _safe_href
from mls.services.inquiry_ghl import _format_inquiry_note, _inquiry_tags, sync_inquiry_to_ghl
from mls.services.lead_ghl import push_lead_to_ghl


def _project(title="Harbour Tower"):
    content = Content.objects.create(
        wp_id=Content.objects.count() + 90_000,
        content_type=Content.PROPERTY,
        title=title,
        slug=f"harbour-{Content.objects.count()}",
        status=Content.PUBLISH,
    )
    # A post_save signal creates the PreComProperty row.
    return content.property


class AssistTests(TestCase):
    def test_rejects_an_empty_question(self):
        response = APIClient().post("/api/mls/ai/assist/", {"question": "  "}, format="json")
        self.assertEqual(response.status_code, 400)

    @mock.patch.dict(os.environ, {"OPENAI_API_KEY": ""})
    def test_fallback_links_stay_on_this_site(self):
        response = APIClient().post(
            "/api/mls/ai/assist/",
            {"question": "Show me assignments in Vaughan"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["fallback"])
        self.assertTrue(body["links"])
        self.assertTrue(all(link["href"].startswith("/") for link in body["links"]))

    def test_drops_external_links(self):
        self.assertIsNone(_safe_href("https://example.com/listings"))
        self.assertEqual(_safe_href("/listings?city=Vaughan"), "/listings?city=Vaughan")


class PreconActivityTests(TestCase):
    def test_records_a_page_view(self):
        project = _project()
        response = APIClient().post(
            "/api/mls/activity/precon/",
            {"project_id": project.pk, "event": "floor_plans", "session_key": "abc"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(PreconActivityEvent.objects.filter(project=project, event="floor_plans").count(), 1)

    def test_studio_report_is_staff_only(self):
        guest = APIClient().get("/api/mls/studio/activity/")
        self.assertIn(guest.status_code, {401, 403})

        staff = get_user_model().objects.create_user(
            email="staff-activity@example.com",
            password="safe-password-123",
            is_staff=True,
            is_active=True,
        )
        client = APIClient()
        client.force_authenticate(user=staff)
        report = client.get("/api/mls/studio/activity/")
        self.assertEqual(report.status_code, 200)
        self.assertIn("top_projects", report.json())


class PushAndCrmTests(TestCase):
    def test_push_subscribe_requires_sign_in(self):
        response = APIClient().post(
            "/api/mls/push/subscribe/",
            {"endpoint": "https://push.example/1", "keys": {"p256dh": "k", "auth": "a"}},
            format="json",
        )
        self.assertIn(response.status_code, {401, 403})

    @override_settings(GHL_API_KEY="", GHL_LOCATION_ID="")
    def test_crm_push_is_a_no_op_without_keys(self):
        push_lead_to_ghl(
            email="lead@example.com",
            source="newsletter",
            tags=["newsletter"],
            note="Newsletter sign-up",
        )

    def test_market_and_assignment_inquiries_are_tagged(self):
        market = PropertyInquiry(
            first_name="A",
            email="a@example.com",
            message="hello",
            page_url="https://homeatlas.test/market-trends",
            intent="explore",
        )
        assignment = PropertyInquiry(
            first_name="A",
            email="a@example.com",
            message="hello",
            listing_key="ASSIGNMENT-4",
            page_url="https://homeatlas.test/assignments/4",
        )
        self.assertIn("market-trends", _inquiry_tags(market))
        self.assertIn("assignment-inquiry", _inquiry_tags(assignment))

    @override_settings(GHL_API_KEY="test-key", GHL_LOCATION_ID="loc", GHL_USER_ID="")
    @mock.patch("accounts.services._lead_details_field_id", return_value="")
    @mock.patch("accounts.services.requests.put")
    @mock.patch("accounts.services.requests.post")
    def test_schedule_viewing_sends_the_reason_with_the_contact(self, post, put, _field):
        message = "I'd like to schedule a showing for 10 King St (MLS® W123)."

        def response(status, payload=None):
            res = mock.Mock()
            res.status_code = status
            res.text = ""
            res.json.return_value = payload or {}
            return res

        def post_side(url, **kwargs):
            if str(url).endswith("/contacts/"):
                return response(201, {"contact": {"id": "contact-1"}})
            return response(201, {"id": "ok"})

        post.side_effect = post_side
        put.return_value = response(200, {})
        inquiry = PropertyInquiry.objects.create(
            first_name="Ada",
            last_name="Lovelace",
            email="ada-showing@example.com",
            phone="4165550100",
            intent="showing",
            message=message,
            listing_key="W123",
        )
        sync_inquiry_to_ghl(inquiry)
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.ghl_contact_id, "contact-1")
        self.assertIsNotNone(inquiry.ghl_synced_at)
        self.assertFalse(inquiry.last_error)

        created = post.call_args_list[0].kwargs["json"]
        self.assertTrue(created["source"].startswith("Schedule viewing:"))
        self.assertIn(message, created["source"])
        self.assertIn("schedule-viewing", created["tags"])

        notes = [call.kwargs["json"] for call in post.call_args_list if str(call.args[0]).endswith("/notes")]
        comments = [call.kwargs["json"] for call in post.call_args_list if "/conversations/messages" in str(call.args[0])]
        self.assertEqual(notes[0]["title"], "Schedule viewing")
        self.assertIn(message, notes[0]["body"])
        self.assertNotIn("Property types", notes[0]["body"])
        self.assertNotIn("Budget", notes[0]["body"])
        self.assertNotIn("Min beds", notes[0]["body"])
        self.assertNotIn("Timeline", notes[0]["body"])
        self.assertNotIn("—", notes[0]["body"])
        self.assertIn(message, comments[0]["message"])
        self.assertEqual(comments[0]["type"], "InternalComment")
        self.assertIn(message, put.call_args.kwargs["json"]["source"])

    def test_inquiry_note_keeps_only_fields_the_visitor_filled(self):
        showing = PropertyInquiry(
            first_name="Ada",
            email="ada@example.com",
            intent="showing",
            message="I'd like to schedule a showing for 26 Millcliff Circle.",
            preferred_locations="26 Millcliff Circle",
            page_url="https://homeatlas.test/property/29692917",
        )
        showing.pk = 94
        note = _format_inquiry_note(showing)
        self.assertIn("Preferred locations: 26 Millcliff Circle", note)
        self.assertIn("Page URL: https://homeatlas.test/property/29692917", note)
        self.assertIn("Inquiry ID (DB): 94", note)
        self.assertNotIn("Property types", note)
        self.assertNotIn("Budget", note)
        self.assertNotIn("—", note)

        buyer = PropertyInquiry(
            first_name="Ada",
            email="ada@example.com",
            intent="buy",
            message="Looking in the east end.",
            property_types="Condo",
            budget_min=500000,
            budget_max=800000,
            bedrooms_min=2,
            bathrooms_min=1,
            timeline="3-6 months",
        )
        filled = _format_inquiry_note(buyer)
        self.assertIn("Property types: Condo", filled)
        self.assertIn("Budget: 500000 – 800000", filled)
        self.assertIn("Min beds / baths: 2 / 1", filled)
        self.assertIn("Timeline: 3-6 months", filled)

    @override_settings(GHL_API_KEY="test-key", GHL_LOCATION_ID="loc", GHL_USER_ID="")
    @mock.patch("accounts.services._lead_details_field_id", return_value="")
    @mock.patch("accounts.services.requests.put")
    @mock.patch("accounts.services.requests.post")
    def test_existing_contact_still_receives_the_lead_reason(self, post, put, _field):
        user = get_user_model().objects.create_user(
            email="known@example.com",
            password="safe-password-123",
            first_name="Known",
        )
        user.ghl_contact_id = "existing-1"
        user.save(update_fields=["ghl_contact_id"])

        def response(status, payload=None):
            res = mock.Mock()
            res.status_code = status
            res.text = ""
            res.json.return_value = payload or {}
            return res

        post.return_value = response(201, {"id": "ok"})
        put.return_value = response(200, {})
        push_lead_to_ghl(
            email=user.email,
            first_name="Known",
            source="newsletter",
            tags=["newsletter"],
            note="Newsletter sign-up from the homepage.",
            user=user,
        )
        urls = [str(call.args[0]) for call in post.call_args_list]
        self.assertFalse(any(url.endswith("/contacts/") for url in urls))
        notes = [call.kwargs["json"] for call in post.call_args_list if str(call.args[0]).endswith("/notes")]
        self.assertIn("Newsletter sign-up from the homepage.", notes[0]["body"])
        self.assertIn("Newsletter sign-up", put.call_args.kwargs["json"]["source"])
