from django.http import StreamingHttpResponse
from django.db.models import OuterRef, Subquery
from django.shortcuts import get_object_or_404
from django.urls import reverse
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    OpenApiTypes,
    extend_schema,
    extend_schema_view,
)
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EstatePrice, EstateProject
from .serializers_estate import (
    EstateDocumentAccessResponseSerializer,
    EstateDocumentIntentRequestSerializer,
    EstateDocumentIntentResponseSerializer,
    EstateProjectListSerializer,
    EstateProjectSerializer,
)
from .services.estate_documents import (
    EstateDocumentError,
    authorize_document_access,
    capture_document_intent,
    get_published_document,
    iter_bounded_content,
    prepare_document_proxy,
)


PUBLISHED_STATUSES = ("publish", "published")
ESTATE_PREFETCHES = (
    "sections",
    "unit_types",
    "prices",
    "deposit_plans__installments",
    "incentives",
    "amenities",
    "documents",
)
JWT_AUTH = [{"jwtAuth": []}]


def _error_response(error):
    return Response({"detail": error.detail}, status=error.status_code)


@extend_schema_view(
    get=extend_schema(
        tags=["Estate Projects"],
        summary="List published estate projects",
        description="Returns canonical estate projects that are currently published.",
        responses={
            200: EstateProjectListSerializer(many=True),
        },
        auth=[],
    )
)
class EstateProjectListAPIView(generics.ListAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = EstateProjectListSerializer

    def get_queryset(self):
        lowest_price = EstatePrice.objects.filter(
            project_id=OuterRef("pk"),
            amount__isnull=False,
        ).order_by("amount", "display_order", "id")
        return EstateProject.objects.filter(
            publication_status__in=PUBLISHED_STATUSES
        ).annotate(
            lowest_price_display=Subquery(lowest_price.values("display_text")[:1])
        )


@extend_schema_view(
    get=extend_schema(
        tags=["Estate Projects"],
        summary="Retrieve a published estate project",
        description=(
            "Returns one published canonical estate project by numeric ID or slug, "
            "including its public document metadata without permanent source URLs."
        ),
        parameters=[
            OpenApiParameter(
                name="lookup",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                description="Estate project numeric ID or slug.",
                required=True,
            )
        ],
        responses={
            200: EstateProjectSerializer,
            404: OpenApiResponse(description="Project is missing or unpublished."),
        },
        auth=[],
    )
)
class EstateProjectDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = EstateProjectSerializer
    queryset = EstateProject.objects.filter(
        publication_status__in=PUBLISHED_STATUSES
    ).prefetch_related(*ESTATE_PREFETCHES)

    def get_object(self):
        value = self.kwargs["lookup"]
        lookup = {"pk": value} if value.isdigit() else {"slug": value}
        return get_object_or_404(self.get_queryset(), **lookup)


@extend_schema_view(
    post=extend_schema(
        tags=["Estate Documents"],
        summary="Capture document access intent",
        description=(
            "Creates an access intent for a published project document. A verified "
            "account is always bound to its registered phone; an unverified account "
            "captures the requested phone for the account OTP flow."
        ),
        request=EstateDocumentIntentRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="document_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="Published estate document ID.",
                required=True,
            )
        ],
        responses={
            201: EstateDocumentIntentResponseSerializer,
            400: OpenApiResponse(description="Phone is invalid, missing, or conflicts with the verified account phone."),
            401: OpenApiResponse(description="Authentication is required."),
            404: OpenApiResponse(description="Document or its published project was not found."),
        },
        auth=JWT_AUTH,
    )
)
class EstateDocumentIntentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, document_id):
        try:
            document = get_published_document(document_id)
            intent = capture_document_intent(
                document=document,
                user=request.user,
                requested_phone=request.data.get("phone"),
            )
        except EstateDocumentError as error:
            return _error_response(error)

        return Response(
            {
                "intent_id": intent.id,
                "verification_required": (
                    document.requires_phone_verification
                    and not request.user.phone_verified
                ),
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    post=extend_schema(
        tags=["Estate Documents"],
        summary="Request document access",
        description=(
            "Validates the latest intent and, for protected documents, the verified "
            "account phone. Returns a short-lived URL for the signed document stream."
        ),
        request=None,
        parameters=[
            OpenApiParameter(
                name="document_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="Published estate document ID.",
                required=True,
            )
        ],
        responses={
            200: EstateDocumentAccessResponseSerializer,
            400: OpenApiResponse(description="The access request is invalid."),
            401: OpenApiResponse(description="Authentication is required."),
            403: OpenApiResponse(description="Intent, phone verification, or matching verified phone is required."),
            404: OpenApiResponse(description="Document or its published project was not found."),
        },
        auth=JWT_AUTH,
    )
)
class EstateDocumentAccessAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, document_id):
        try:
            document = get_published_document(document_id)
            token = authorize_document_access(document=document, user=request.user)
        except EstateDocumentError as error:
            return _error_response(error)

        proxy_path = reverse("estate-document-proxy")
        return Response(
            {"access_url": request.build_absolute_uri(f"{proxy_path}?token={token}")}
        )


@extend_schema_view(
    get=extend_schema(
        tags=["Estate Documents"],
        summary="Stream an authorized document",
        description=(
            "Validates the short-lived signed token and exact intent, document, and "
            "user binding, then streams the HTTPS allowlisted upstream document."
        ),
        parameters=[
            OpenApiParameter(
                name="token",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Short-lived signed document access token.",
                required=True,
            )
        ],
        responses={
            (200, "application/octet-stream"): OpenApiResponse(
                response=OpenApiTypes.BINARY,
                description="Authorized binary document stream.",
            ),
            400: OpenApiResponse(description="The stream request is invalid."),
            403: OpenApiResponse(description="Document access is denied."),
            404: OpenApiResponse(description="Token, intent, document, or published project was not found."),
            413: OpenApiResponse(description="The upstream document exceeds the response size limit."),
            502: OpenApiResponse(description="The upstream document fetch failed."),
            503: OpenApiResponse(description="The external document service is unavailable."),
        },
        auth=[],
    )
)
class EstateDocumentProxyAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            prepared = prepare_document_proxy(request.query_params.get("token", ""))
        except EstateDocumentError as error:
            return _error_response(error)

        document = prepared.document
        upstream = prepared.upstream
        response = StreamingHttpResponse(
            iter_bounded_content(upstream),
            content_type=upstream.headers.get(
                "Content-Type", "application/octet-stream"
            ),
        )
        response["Content-Disposition"] = (
            f'attachment; filename="estate-document-{document.id}"'
        )
        response["Cache-Control"] = "private, no-store"
        return response
