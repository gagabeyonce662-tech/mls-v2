from django.db import DatabaseError, connection
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["Health"],
        summary="Check application liveness",
        description=(
            "Confirms that the Django application has started and can "
            "respond to HTTP requests. This endpoint does not query the database."
        ),
        responses={
            200: OpenApiResponse(
                description="The application is running.",
                response={
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "example": "ok",
                        },
                        "service": {
                            "type": "string",
                            "example": "mls-backend",
                        },
                    },
                },
            ),
        },
        auth=[],
    )
    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "mls-backend",
            },
            status=status.HTTP_200_OK,
        )


class ReadinessView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["Health"],
        summary="Check application readiness",
        description=(
            "Confirms that the Django application can communicate with "
            "the PostgreSQL database."
        ),
        responses={
            200: OpenApiResponse(
                description="The application and database are available.",
                response={
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "example": "ok",
                        },
                        "database": {
                            "type": "string",
                            "example": "ok",
                        },
                    },
                },
            ),
            503: OpenApiResponse(
                description="The database is unavailable.",
                response={
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "example": "unavailable",
                        },
                        "database": {
                            "type": "string",
                            "example": "error",
                        },
                    },
                },
            ),
        },
        auth=[],
    )
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError:
            return Response(
                {
                    "status": "unavailable",
                    "database": "error",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "status": "ok",
                "database": "ok",
            },
            status=status.HTTP_200_OK,
        )