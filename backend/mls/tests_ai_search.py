"""AI search: parsing, validation, the endpoint, embeddings and ranking.

OpenAI is always mocked — these tests never make a network call.
"""

import json
import os
from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from .models import AISearchLog, Property, PropertyEmbedding
from .services import ai_listing_summary, ai_search, listing_embeddings, openai_client
from .services.openai_client import ChatResult, OpenAIError

PARSE_URL = "/api/mls/ai-search/parse/"
FILTER_URL = "/api/mls/properties/filter/"
KEY_ENV = {"OPENAI_API_KEY": "test-key", "OPENAI_EMBEDDING_DIMENSIONS": "3"}


def _model_reply(**overrides):
    reply = ai_search.empty_filters()
    reply.update(overrides)
    return ChatResult(content=json.dumps(reply), model="test-model", prompt_tokens=120, completion_tokens=40)


def _listing(key, *, remarks="", days_old=1, city="Toronto", **extra):
    return Property.objects.create(
        listing_key=key,
        city=city,
        state_or_province="ON",
        list_price=800000,
        standard_status="Active",
        public_remarks=remarks,
        original_entry_timestamp=timezone.now() - timedelta(days=days_old),
        modification_timestamp=timezone.now() - timedelta(days=days_old),
        **extra,
    )


class ValidateFiltersTests(TestCase):
    def setUp(self):
        cache.clear()
        _listing("m1", city="Mississauga")

    def test_swaps_inverted_ranges_and_drops_out_of_range(self):
        out = ai_search.validate_filters(
            {"price_min": 900000, "price_max": 500000, "beds_min": 99, "sqft_min": -5, "year_built_min": 1200}
        )
        self.assertEqual((out["price_min"], out["price_max"]), (500000, 900000))
        self.assertIsNone(out["beds_min"])
        self.assertIsNone(out["sqft_min"])
        self.assertIsNone(out["year_built_min"])

    def test_unknown_enum_values_are_dropped(self):
        out = ai_search.validate_filters({"property_type": "Castle", "transaction": "barter", "sort": "random"})
        self.assertIsNone(out["property_type"])
        self.assertIsNone(out["transaction"])
        self.assertIsNone(out["sort"])

    def test_low_price_without_transaction_is_a_rent(self):
        self.assertEqual(ai_search.validate_filters({"price_max": 2500})["transaction"], "rent")
        self.assertIsNone(ai_search.validate_filters({"price_max": 900000})["transaction"])

    def test_city_matches_catalogue_spelling(self):
        self.assertEqual(ai_search.validate_filters({"city": "mississauga"})["city"], "Mississauga")
        self.assertEqual(ai_search.validate_filters({"city": "Missisauga"})["city"], "Mississauga")

    def test_postal_codes_normalised_and_invalid_dropped(self):
        out = ai_search.validate_filters({"postal_codes": ["m5v 2t6", "L7A", "nope", "L7A"]})
        self.assertEqual(out["postal_codes"], ["M5V2T6", "L7A"])

    def test_booleans_are_not_numbers(self):
        self.assertIsNone(ai_search.validate_filters({"beds_min": True})["beds_min"])


@mock.patch.dict(os.environ, KEY_ENV)
class ParseSearchQueryTests(TestCase):
    def setUp(self):
        cache.clear()

    @mock.patch.object(openai_client, "chat")
    def test_parses_and_caches(self, chat):
        chat.return_value = _model_reply(property_type="Condo", beds_min=3, price_max=900000, semantic_text="near subway")
        first = ai_search.parse_search_query("3 bed condo under 900k near a subway")
        second = ai_search.parse_search_query("  3 BED condo under 900k   near a subway ")

        self.assertFalse(first.fallback)
        self.assertEqual(first.filters["property_type"], "Condo")
        self.assertEqual(first.filters["semantic_text"], "near subway")
        self.assertTrue(second.cached)
        self.assertEqual(chat.call_count, 1)
        # Strict structured output was requested.
        self.assertEqual(chat.call_args.kwargs["json_schema"], ai_search.FILTER_SCHEMA)

    @mock.patch.object(openai_client, "chat", side_effect=OpenAIError("[HTTP 500] boom"))
    def test_openai_failure_falls_back_to_keywords(self, _chat):
        result = ai_search.parse_search_query("house with a pool in Oakville")
        self.assertFalse(result.fallback)
        self.assertEqual(result.filters["city"], "Oakville")
        self.assertEqual(result.filters["semantic_text"], "pool")
        self.assertIsNone(result.filters["keywords"])
        self.assertIn("boom", result.error)

    @mock.patch.object(openai_client, "chat")
    def test_refinement_sends_current_filters(self, chat):
        chat.return_value = _model_reply(price_max=700000)
        ai_search.parse_search_query("cheaper", {"price_max": 900000, "evil": "drop me"})
        user_message = chat.call_args.args[0][1]["content"]
        self.assertIn('"price_max": 900000', user_message)
        self.assertNotIn("evil", user_message)

    def test_not_configured_still_reads_the_sentence(self):
        with mock.patch.dict(os.environ, {"OPENAI_API_KEY": "", "GEMINI_API_KEY": ""}):
            result = ai_search.parse_search_query("condo in Toronto")
        self.assertFalse(result.fallback)
        self.assertEqual(result.filters["property_type"], "Condo")
        self.assertEqual(result.filters["city"], "Toronto")


@mock.patch.dict(os.environ, KEY_ENV)
class AISearchEndpointTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_empty_query_is_400(self):
        self.assertEqual(self.client.post(PARSE_URL, {"query": "  "}, content_type="application/json").status_code, 400)

    @mock.patch.object(openai_client, "chat")
    def test_returns_filters_and_logs(self, chat):
        chat.return_value = _model_reply(city="Toronto", unsupported=["good schools"])
        response = self.client.post(
            PARSE_URL, {"query": "home in Toronto near good schools"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["filters"]["city"], "Toronto")
        self.assertEqual(body["unsupported"], ["good schools"])
        self.assertNotIn("unsupported", body["filters"])
        log = AISearchLog.objects.get()
        self.assertEqual(log.prompt_tokens, 120)
        self.assertFalse(log.fallback)

    def test_current_filters_must_be_an_object(self):
        response = self.client.post(
            PARSE_URL, {"query": "cheaper", "current_filters": [1]}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)


@mock.patch.dict(os.environ, KEY_ENV)
class EmbeddingTests(TestCase):
    def setUp(self):
        cache.clear()

    @mock.patch.object(openai_client, "embed")
    def test_embed_pending_skips_unchanged_text(self, embed):
        embed.side_effect = lambda texts, **_: [[1.0, 0.0, 0.0] for _ in texts]
        home = _listing("a", remarks="Sunny bungalow")
        _listing("b", remarks="Downtown loft")

        self.assertEqual(listing_embeddings.embed_pending()["embedded"], 2)
        self.assertEqual(listing_embeddings.embed_pending()["embedded"], 0)

        home.public_remarks = "Sunny bungalow with a pool"
        home.save(update_fields=["public_remarks"])
        summary = listing_embeddings.embed_pending()
        self.assertEqual((summary["embedded"], summary["unchanged"]), (1, 1))
        self.assertEqual(PropertyEmbedding.objects.count(), 2)

    def test_embedding_text_includes_features_and_remarks(self):
        prop = _listing("c", remarks="Renovated kitchen", bedrooms_total=3, pool_features="['Inground']")
        text = listing_embeddings.build_embedding_text(prop)
        self.assertIn("3 bedrooms", text)
        self.assertIn("Pool: Inground", text)
        self.assertIn("Renovated kitchen", text)


@mock.patch.dict(os.environ, KEY_ENV)
class RelevanceRankingTests(TestCase):
    def setUp(self):
        cache.clear()
        # Newest first by default: far (1 day), mid (2), near (3).
        self.far = _listing("far", days_old=1)
        self.mid = _listing("mid", days_old=2)
        self.near = _listing("near", days_old=3)
        for prop, vec in ((self.far, [0, 1, 0]), (self.mid, [0.6, 0.8, 0]), (self.near, [1, 0, 0])):
            PropertyEmbedding.objects.create(
                property=prop,
                model=openai_client.embedding_model(),
                dimensions=3,
                text_hash="x",
                vector=listing_embeddings.pack(vec),
            )

    def keys(self, **params):
        response = self.client.get(FILTER_URL, {"limit": 10, **params})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        return [r["listing_key"] for r in body["results"]], body["ranked_by_relevance"]

    @mock.patch.object(openai_client, "embed", return_value=[[1.0, 0.0, 0.0]])
    def test_relevance_orders_by_similarity(self, _embed):
        self.assertEqual(self.keys(orderby="relevance", semantic="near subway"), (["near", "mid", "far"], True))

    @mock.patch.object(openai_client, "embed", return_value=[[1.0, 0.0, 0.0]])
    def test_paging_through_ranked_results(self, _embed):
        response = self.client.get(FILTER_URL, {"limit": 2, "offset": 2, "orderby": "relevance", "semantic": "x"}).json()
        self.assertEqual([r["listing_key"] for r in response["results"]], ["far"])
        self.assertEqual(response["count"], 3)

    @mock.patch.object(openai_client, "embed", side_effect=OpenAIError("down"))
    def test_openai_down_keeps_normal_order(self, _embed):
        self.assertEqual(self.keys(orderby="relevance", semantic="near subway"), (["far", "mid", "near"], False))

    @mock.patch.object(openai_client, "embed")
    def test_other_sorts_ignore_semantic(self, embed):
        keys, ranked = self.keys(orderby="-modification_timestamp", semantic="near subway")
        self.assertEqual((keys, ranked), (["far", "mid", "near"], False))
        embed.assert_not_called()

    def test_relevance_without_semantic_is_newest(self):
        self.assertEqual(self.keys(orderby="relevance"), (["far", "mid", "near"], False))


class ListingSummaryOpenAITests(TestCase):
    COMPLETE = (
        "## Snapshot\n- a\n- b\n## Confirmed listing facts\n- c\n- d\n"
        "## Ownership costs and conditions\n- e\n## Verify before deciding\n- f\n"
        "## Questions to ask\n- g\n" + ("Detail. " * 20)
    )

    @mock.patch.dict(os.environ, {"OPENAI_API_KEY": "k", "OPENAI_SUMMARY_MODEL": "first,second"})
    @mock.patch.object(openai_client, "chat")
    def test_falls_through_models_until_one_succeeds(self, chat):
        chat.side_effect = [OpenAIError("[HTTP 404] no such model"), ChatResult(content=self.COMPLETE, model="second")]
        summary = ai_listing_summary.generate_listing_summary({"transaction_type": "sale"})
        self.assertEqual(summary, self.COMPLETE.strip())
        self.assertEqual([c.kwargs["model"] for c in chat.call_args_list], ["first", "second"])

    @mock.patch.dict(os.environ, {"OPENAI_API_KEY": "k", "OPENAI_SUMMARY_MODEL": "only"})
    @mock.patch.object(openai_client, "chat", return_value=ChatResult(content="## Snapshot\n- too short", model="only"))
    def test_incomplete_summary_is_an_error(self, _chat):
        with self.assertRaises(ai_listing_summary.AISummaryGenerationError):
            ai_listing_summary.generate_listing_summary({})
