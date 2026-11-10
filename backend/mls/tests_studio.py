"""Staff Studio (scope #2d). SimpleTestCase: models are faked, no database."""
from types import SimpleNamespace
from unittest import mock

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from mls import views_studio
from mls.models import ListingSubmission
from mls.serializers_studio import StudioPreconWriteSerializer
from mls.services import submission_notifications as notes

Status = ListingSubmission.Status


def submission(**overrides):
    values = dict(
        pk=7, status=Status.SUBMITTED, purpose="assignment", project_name="Line 5 Condos",
        address_line_1="1 Main St", city="Vaughan", contact_name="Ana", contact_email="ana@example.com",
        review_note="",
    )
    values.update(overrides)
    return SimpleNamespace(**values)


def staff(is_staff=True):
    return SimpleNamespace(is_authenticated=True, is_staff=is_staff, pk=1)


@override_settings(FRONTEND_URL="https://estate4u.test")
class DecisionEmailTests(SimpleTestCase):
    def test_approved_assignment_links_to_public_page(self):
        subject, body = notes.build_decision_email(submission(status=Status.APPROVED))
        self.assertIn("live", subject)
        self.assertIn("https://estate4u.test/assignments/7", body)

    def test_needs_changes_includes_note_and_account_link(self):
        _, body = notes.build_decision_email(
            submission(status=Status.NEEDS_CHANGES, review_note="Add a floor plan.")
        )
        self.assertIn("Add a floor plan.", body)
        self.assertIn("/watched?tab=listings", body)

    def test_owner_actions_send_nothing(self):
        for state in (Status.DRAFT, Status.SUBMITTED, Status.WITHDRAWN):
            self.assertIsNone(notes.build_decision_email(submission(status=state)))

    def test_send_never_raises(self):
        with mock.patch.object(notes, "send_mail", side_effect=RuntimeError("smtp down")):
            self.assertFalse(notes.send_submission_decision_email(submission(status=Status.APPROVED)))


class DecisionViewTests(SimpleTestCase):
    def post(self, current, body, user=None):
        request = APIRequestFactory().post("/x/", body, format="json")
        force_authenticate(request, user=user or staff())
        subject = submission(status=current)
        with mock.patch.object(views_studio, "get_object_or_404", return_value=subject), mock.patch.object(
            views_studio, "_submission_queryset"
        ):
            return views_studio.StudioSubmissionDecisionAPIView.as_view()(request, pk=7)

    def test_non_staff_is_refused(self):
        response = self.post(Status.SUBMITTED, {"status": "approved"}, user=staff(is_staff=False))
        self.assertEqual(response.status_code, 403)

    def test_disallowed_transition_is_a_conflict(self):
        response = self.post(Status.REJECTED, {"status": "approved"})
        self.assertEqual(response.status_code, 409)

    def test_reject_requires_a_note(self):
        response = self.post(Status.SUBMITTED, {"status": "rejected", "review_note": "  "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("review_note", response.data)

    def test_approve_saves_stamps_and_emails(self):
        request = APIRequestFactory().post("/x/", {"status": "approved"}, format="json")
        user = staff()
        force_authenticate(request, user=user)
        subject = submission()
        subject.save = mock.Mock()
        with mock.patch.object(views_studio, "get_object_or_404", return_value=subject), mock.patch.object(
            views_studio, "_submission_queryset"
        ), mock.patch.object(views_studio, "StudioSubmissionDetailSerializer") as serializer, mock.patch.object(
            views_studio, "send_submission_decision_email", return_value=True
        ) as send:
            serializer.return_value.data = {}
            response = views_studio.StudioSubmissionDecisionAPIView.as_view()(request, pk=7)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(subject.status, Status.APPROVED)
        self.assertIs(subject.reviewed_by, user)
        self.assertIsNotNone(subject.reviewed_at)
        self.assertNotIn("precon_property", subject.save.call_args.kwargs["update_fields"])
        send.assert_called_once_with(subject)
        self.assertTrue(response.data["emailed"])


class TransitionTableTests(SimpleTestCase):
    def test_owner_states_have_no_reviewer_moves(self):
        self.assertNotIn(Status.DRAFT, views_studio.ALLOWED_DECISIONS)
        self.assertNotIn(Status.WITHDRAWN, views_studio.ALLOWED_DECISIONS)

    def test_queue_never_lists_drafts(self):
        for statuses in views_studio.QUEUE_FILTERS.values():
            self.assertNotIn(Status.DRAFT, statuses)


class PreconWriteSerializerTests(SimpleTestCase):
    def test_meta_keys_must_be_snake_case(self):
        serializer = StudioPreconWriteSerializer(data={"meta": {"Bad Key": "x"}}, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("meta", serializer.errors)

    def test_meta_accepts_null_to_delete(self):
        serializer = StudioPreconWriteSerializer(
            data={"meta": {"occupancy_year": "2028", "price_display": None}}, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data["meta"]["price_display"])

    def test_create_requires_title(self):
        self.assertFalse(StudioPreconWriteSerializer(data={}).is_valid())

    def test_attachment_urls_fit_the_column(self):
        long_url = "https://res.cloudinary.com/" + "a" * 200 + ".jpg"
        serializer = StudioPreconWriteSerializer(data={"attachments": [{"url": long_url}]}, partial=True)
        self.assertFalse(serializer.is_valid())


class StudioWpIdTests(SimpleTestCase):
    def test_studio_ids_start_above_the_floor(self):
        with mock.patch.object(views_studio.Content.objects, "aggregate", return_value={"top": 55_000}):
            self.assertEqual(views_studio._next_wp_id(), views_studio.STUDIO_WP_ID_FLOOR + 1)
        with mock.patch.object(views_studio.Content.objects, "aggregate", return_value={"top": 10_000_005}):
            self.assertEqual(views_studio._next_wp_id(), 10_000_006)


class SavePreconCreateTests(SimpleTestCase):
    def test_create_reuses_row_inserted_by_content_signal(self):
        """Content post_save already creates PreComProperty — create must not insert twice."""
        content = mock.Mock()
        content.status = "draft"
        content.published_at = None
        content.pk = 42
        content.attachments = mock.Mock()
        content.attachments.all.return_value = []
        content.attachments.all().delete = mock.Mock()

        precon = mock.Mock()
        precon.is_featured = False
        precon.content = content
        precon.pk = 7

        content_ctor = mock.Mock(return_value=content)
        get_or_create = mock.Mock(return_value=(precon, True))

        with mock.patch.object(views_studio, "_next_wp_id", return_value=10_000_001), mock.patch.object(
            views_studio, "Content", content_ctor
        ), mock.patch.object(
            views_studio.PreComProperty.objects, "get_or_create", get_or_create
        ), mock.patch.object(views_studio.Attachment.objects, "bulk_create"):
            result = views_studio.save_precon(None, {"title": "Test name", "developer_name": "Acme"})

        content.save.assert_called_once()
        get_or_create.assert_called_once_with(content=content)
        precon.save.assert_called_once()
        self.assertIs(result, precon)
        self.assertEqual(precon.developer_name, "Acme")
