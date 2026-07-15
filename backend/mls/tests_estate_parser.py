from django.test import TestCase

from .services.estate_content import parse_estate_content


class EstateParserTests(TestCase):
    def test_preserves_residual_rich_html_exactly(self):
        rich_html = (
            '<h2 data-id="overview">Overview</h2>'
            '<p class="lead">Text <strong>bold</strong> '
            '<a href="https://example.com/about">link</a>.</p>'
            '<ul class="features"><li>First</li><li><em>Second</em></li></ul>'
            '<table><tr><th>Label</th><td>Value</td></tr></table>'
        )
        parsed = parse_estate_content(rich_html)

        self.assertEqual(
            parsed.sections[0].html,
            rich_html[rich_html.index("<p"):],
        )

    def test_uses_metadata_and_taxonomies_as_supporting_inputs(self):
        parsed = parse_estate_content(
            "<p>Overview</p>",
            {"fave_property_price": "$899,000"},
            {"type": ["Townhomes"], "features": ["Closing credit"]},
        )

        self.assertEqual(parsed.unit_types[0].text, "Townhomes")
        self.assertEqual(parsed.prices[0].amount, 899000)
        self.assertEqual(parsed.incentives[0].text, "Closing credit")

    def test_groups_deposit_installments_under_one_plan(self):
        parsed = parse_estate_content(
            "<h2>Deposit Schedule</h2><ul>"
            "<li>Signing: 5%</li><li>30 days: $25,000</li></ul>"
        )

        self.assertEqual(len(parsed.deposit_plans), 1)
        self.assertEqual(len(parsed.deposit_plans[0].installments), 2)
        self.assertEqual(parsed.deposit_plans[0].installments[0].percentage, 5)

    def test_warns_and_preserves_ambiguous_content(self):
        parsed = parse_estate_content(
            "<h2>Pricing</h2><p>$500,000 to $700,000</p>"
            "<h2>Deposit Schedule</h2><p>Contact us for details</p>"
        )

        self.assertIsNone(parsed.prices[0].amount)
        self.assertTrue(
            any("Ambiguous price" in warning for warning in parsed.warnings)
        )
        self.assertTrue(
            any(
                "Ambiguous or unsupported deposits" in warning
                for warning in parsed.warnings
            )
        )
        self.assertIn("Contact us for details", parsed.sections[0].html)
