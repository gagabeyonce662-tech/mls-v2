"""Similar-assignment scoring. SimpleTestCase: the queryset is faked, no database."""
from decimal import Decimal
from types import SimpleNamespace
from unittest import mock

from django.test import SimpleTestCase

from mls import views


def sub(pk, city="Vaughan", price="700000", project=None, builder="", purpose="assignment"):
    return SimpleNamespace(
        pk=pk, city=city, asking_price=Decimal(price) if price else None,
        precon_property_id=project, builder_name=builder, purpose=purpose,
    )


class FakeQS(list):
    def filter(self, **kwargs):
        return FakeQS(s for s in self if all(getattr(s, k) == v for k, v in kwargs.items()))

    def exclude(self, pk):
        return FakeQS(s for s in self if s.pk != pk)


class SimilarTests(SimpleTestCase):
    def rank(self, subject, others):
        with mock.patch.object(views, "_public_submissions", return_value=FakeQS([subject, *others])):
            return [s.pk for s in views.similar_public_submissions(subject, limit=4)]

    def test_same_project_ranks_first(self):
        subject = sub(1, project=9)
        others = [sub(2, city="Vaughan"), sub(3, city="Toronto", project=9)]
        self.assertEqual(self.rank(subject, others)[0], 3)

    def test_excludes_self_other_purposes_and_unrelated(self):
        subject = sub(1)
        others = [sub(2, purpose="sale"), sub(3, city="Ottawa", price=None), sub(4)]
        self.assertEqual(self.rank(subject, others), [4])

    def test_closer_price_wins_within_a_city(self):
        subject = sub(1, price="700000")
        others = [sub(2, price="1400000"), sub(3, price="710000")]
        self.assertEqual(self.rank(subject, others), [3, 2])


class HomeTypeFilterTests(SimpleTestCase):
    def test_values_or_together_and_unknowns_are_ignored(self):
        from django.http import QueryDict

        from mls.services.query_helpers import home_type_q

        self.assertIsNone(home_type_q(QueryDict("home_type=castle")))
        self.assertIsNone(home_type_q(QueryDict("")))
        combined = home_type_q(QueryDict("home_type=condo,townhouse"))
        self.assertIn("Apartment", str(combined))
        self.assertIn("Row / Townhouse", str(combined))
        detached = str(home_type_q(QueryDict("home_type=detached")))
        self.assertIn("property_attached_yn", detached)
