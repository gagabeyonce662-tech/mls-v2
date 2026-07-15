from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib import admin
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image

from .admin import EstatePropertyAdmin
from .models import EstateProperty, EstatePropertyImage
from .views_estate import EstatePropertyAPIViewMixinMethods


def image_upload(name="home.png", image_format="PNG", size=(2, 2)):
    content = BytesIO()
    Image.new("RGB", size, "white").save(content, image_format)
    return SimpleUploadedFile(name, content.getvalue(), content_type=f"image/{image_format.lower()}")


@override_settings(ESTATE_IMAGE_STORAGE_CONFIGURED=True, ESTATE_IMAGE_MAX_UPLOAD_MB=10)
class EstatePropertyImageTests(SimpleTestCase):
    def test_uploaded_featured_image_precedes_legacy_url(self):
        estate = EstateProperty(
            listing_key="estate-1",
            featured_image_url="https://legacy.example/image.jpg",
        )
        estate.featured_image.name = "mls/estate-properties/featured/new.png"
        with patch("mls.models.default_storage.url", return_value="https://res.cloudinary.com/demo/new.png"):
            self.assertEqual(estate.effective_featured_image_url, "https://res.cloudinary.com/demo/new.png")

    def test_legacy_featured_url_remains_available_without_upload(self):
        estate = EstateProperty(listing_key="estate-1", featured_image_url="https://legacy.example/image.jpg")
        self.assertEqual(estate.effective_featured_image_url, "https://legacy.example/image.jpg")

    def test_missing_featured_image_returns_none(self):
        self.assertIsNone(EstateProperty(listing_key="estate-1").effective_featured_image_url)

    def test_api_keeps_featured_image_url_and_exposes_ordered_gallery(self):
        gallery = [
            SimpleNamespace(id=9, estate_property_id=1, image_url="https://res.cloudinary.com/demo/one.png", caption="Front", sort_order=1),
        ]
        with patch("mls.views_estate.EstatePropertyImage.objects.filter") as image_filter, patch(
            "mls.views_estate.estate_image_url", return_value="https://res.cloudinary.com/demo/featured.png"
        ):
            image_filter.return_value.order_by.return_value = gallery
            rows = EstatePropertyAPIViewMixinMethods._with_image_urls(
                [{"id": 1, "featured_image": "featured.png", "featured_image_url": "https://legacy.example/old.jpg"}]
            )
        self.assertEqual(rows[0]["featured_image_url"], "https://res.cloudinary.com/demo/featured.png")
        self.assertEqual(rows[0]["gallery_images"][0]["caption"], "Front")

    def test_invalid_file_is_rejected(self):
        estate = EstateProperty(listing_key="estate-1")
        estate.featured_image = SimpleUploadedFile("not-image.txt", b"not an image", content_type="text/plain")
        with self.assertRaises(ValidationError):
            estate.clean()

    @override_settings(ESTATE_IMAGE_MAX_UPLOAD_MB=0)
    def test_oversized_file_is_rejected(self):
        estate = EstateProperty(listing_key="estate-1", featured_image=image_upload())
        with self.assertRaises(ValidationError):
            estate.clean()

    def test_gallery_has_deterministic_ordering(self):
        self.assertEqual(EstatePropertyImage._meta.ordering, ["sort_order", "id"])

    def test_admin_preview_handles_missing_image(self):
        admin_view = EstatePropertyAdmin(EstateProperty, admin.site)
        self.assertEqual(admin_view.featured_image_preview(EstateProperty(listing_key="estate-1")), "No image")

    def test_validation_never_saves_or_calls_cloudinary(self):
        estate = EstateProperty(listing_key="estate-1", featured_image=image_upload())
        with patch("mls.models.default_storage.save") as save:
            estate.clean()
        save.assert_not_called()
