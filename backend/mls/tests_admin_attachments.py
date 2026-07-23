from django.test import TestCase

from mls.admin import AttachmentAdminForm, infer_attachment_mime_type
from mls.models import Content


class AttachmentAdminFormTests(TestCase):
    def setUp(self):
        self.content = Content.objects.create(
            wp_id=990001,
            content_type=Content.PROPERTY,
            title="Attachment form test",
            slug="attachment-form-test",
            status="draft",
        )

    def test_infers_image_mime_type_from_url_when_blank(self):
        form = AttachmentAdminForm(
            data={
                "content": self.content.pk,
                "url": "https://cdn.example.com/rendering.webp",
                "mime_type": "",
                "title": "Rendering",
            }
        )

        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["mime_type"], "image/webp")

    def test_keeps_manual_mime_type_override(self):
        form = AttachmentAdminForm(
            data={
                "content": self.content.pk,
                "url": "https://drive.google.com/drive/folders/example",
                "mime_type": "application/pdf",
                "title": "Floor plans",
            }
        )

        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["mime_type"], "application/pdf")

    def test_extensionless_links_are_generic_documents(self):
        self.assertEqual(
            infer_attachment_mime_type(
                "https://drive.google.com/drive/folders/example"
            ),
            "application/octet-stream",
        )
