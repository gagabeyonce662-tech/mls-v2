from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.test import override_settings

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

    @override_settings(PRECON_ASSET_STORAGE_CONFIGURED=True, PRECON_ASSET_MAX_UPLOAD_MB=25)
    @patch("mls.admin.cloudinary_uploader.upload")
    def test_uploads_an_asset_to_cloudinary_and_saves_its_delivery_url(self, upload):
        upload.return_value = {"secure_url": "https://res.cloudinary.com/example/image/upload/project.webp"}
        form = AttachmentAdminForm(
            data={
                "content": self.content.pk,
                "url": "",
                "mime_type": "",
                "title": "Project rendering",
            },
            files={
                "upload": SimpleUploadedFile(
                    "project.webp", b"test-image", content_type="image/webp"
                ),
            },
        )

        self.assertTrue(form.is_valid(), form.errors)
        attachment = form.save()
        self.assertEqual(attachment.url, upload.return_value["secure_url"])
        self.assertEqual(attachment.mime_type, "image/webp")
        upload.assert_called_once()
