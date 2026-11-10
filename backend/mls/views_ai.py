"""AI search: POST a sentence, get back the filters manual search uses."""

import logging

from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from .models import AIAssistLog, AISearchLog
from .services.ai_assist import MAX_QUESTION_CHARS, answer_question
from .services.ai_search import MAX_QUERY_CHARS, parse_search_query

logger = logging.getLogger(__name__)


class AISearchAnonThrottle(AnonRateThrottle):
    """Guests, per client IP (the Next.js proxy forwards X-Forwarded-For)."""

    scope = "ai_search_anon"


class AISearchUserThrottle(UserRateThrottle):
    """Signed-in users, per account — a higher allowance than guests."""

    scope = "ai_search_user"


class AISearchParseAPIView(APIView):
    """
    POST /api/mls/ai-search/parse/

    Body: ``{"query": "3 bed condo under 900k near a subway",
    "current_filters": {...optional, for "make it cheaper" refinements}}``.

    Always answers 200 with filters: when OpenAI is unavailable the reply has
    ``fallback: true`` and the raw text as ``keywords``, so search still works.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AISearchAnonThrottle, AISearchUserThrottle]

    @extend_schema(
        summary="Parse a natural-language home search",
        request=inline_serializer(
            name="AISearchParseRequest",
            fields={
                "query": serializers.CharField(max_length=MAX_QUERY_CHARS),
                "current_filters": serializers.DictField(required=False),
                "session_key": serializers.CharField(required=False),
            },
        ),
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="AISearchParseResponse",
                    fields={
                        "filters": serializers.DictField(),
                        "unsupported": serializers.ListField(child=serializers.CharField()),
                        "fallback": serializers.BooleanField(),
                        "cached": serializers.BooleanField(),
                    },
                )
            ),
            400: OpenApiResponse(description="Missing or invalid query."),
            429: OpenApiResponse(description="Rate limited."),
        },
        auth=[],
    )
    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        query = data.get("query")
        if not isinstance(query, str) or not query.strip():
            return Response({"error": "Describe the home you're looking for."}, status=status.HTTP_400_BAD_REQUEST)
        current = data.get("current_filters")
        if current is not None and not isinstance(current, dict):
            return Response({"error": "current_filters must be an object."}, status=status.HTTP_400_BAD_REQUEST)

        result = parse_search_query(query, current)

        try:
            AISearchLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                session_key=str(data.get("session_key") or request.headers.get("X-Session-Key", ""))[:64],
                query=query.strip()[:MAX_QUERY_CHARS],
                current_filters=current or {},
                filters=result.filters,
                fallback=result.fallback,
                cached=result.cached,
                error=result.error,
                model=result.model[:80],
                prompt_tokens=result.prompt_tokens,
                completion_tokens=result.completion_tokens,
                latency_ms=result.latency_ms,
            )
        except Exception:  # noqa: BLE001 - logging must never break search
            logger.exception("Could not write AISearchLog")

        return Response(result.as_response())


class AIAssistAnonThrottle(AnonRateThrottle):
    scope = "ai_assist_anon"


class AIAssistUserThrottle(UserRateThrottle):
    scope = "ai_assist_user"


class AIAssistAPIView(APIView):
    """
    POST /api/mls/ai/assist/

    Body: ``{"question": "...", "session_key": "..."}``.

    Answers from site data only (listings, pre-con, assignments, page list).
    When OpenAI is not configured the reply is still 200, with ``fallback``
    and links to the closest pages.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AIAssistAnonThrottle, AIAssistUserThrottle]

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        question = data.get("question")
        if not isinstance(question, str) or not question.strip():
            return Response({"error": "Ask a question about the site."}, status=status.HTTP_400_BAD_REQUEST)
        question = question.strip()[:MAX_QUESTION_CHARS]
        result = answer_question(question)
        try:
            AIAssistLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                session_key=str(data.get("session_key") or "")[:64],
                question=question,
                answer=result.answer,
                links=result.links,
                handoff=result.handoff,
                fallback=result.fallback,
                error=result.error,
                model=result.model[:80],
                prompt_tokens=result.prompt_tokens,
                completion_tokens=result.completion_tokens,
                latency_ms=result.latency_ms,
            )
        except Exception:
            logger.exception("Could not write AIAssistLog")
        return Response(result.as_response())
