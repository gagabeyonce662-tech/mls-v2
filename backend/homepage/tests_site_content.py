"""Validation for the admin site console. No database."""

from django.test import SimpleTestCase

from homepage.site_content import SiteValidationError, default_documents, validate_document


class SiteContentValidationTests(SimpleTestCase):
    def test_defaults_are_valid(self):
        documents = default_documents()
        for key, document in documents.items():
            self.assertEqual(validate_document(key, document), document)

    def test_hero_heading_that_would_overflow_is_rejected(self):
        document = default_documents()["homepage"]
        document["sections"][0]["content"]["lines"][0] = "This heading is far too long"
        with self.assertRaises(SiteValidationError) as caught:
            validate_document("homepage", document)
        self.assertIn("sections.hero.lines.0", caught.exception.fields)

    def test_hero_cannot_be_hidden(self):
        document = default_documents()["homepage"]
        document["sections"][0]["visible"] = False
        with self.assertRaises(SiteValidationError):
            validate_document("homepage", document)

    def test_scrim_below_forty_is_rejected(self):
        document = default_documents()["homepage"]
        document["sections"][0]["content"]["scrim"] = 20
        with self.assertRaises(SiteValidationError) as caught:
            validate_document("homepage", document)
        self.assertIn("sections.hero.scrim", caught.exception.fields)

    def test_footer_rejects_a_fifth_column(self):
        document = default_documents()["chrome"]
        document["footer"]["columns"].append(document["footer"]["columns"][0])
        with self.assertRaises(SiteValidationError):
            validate_document("chrome", document)

    def test_javascript_links_are_rejected(self):
        document = default_documents()["chrome"]
        document["nav"]["links"][0]["href"] = "javascript:alert(1)"
        with self.assertRaises(SiteValidationError):
            validate_document("chrome", document)
