from unittest.mock import patch

from django.db import DatabaseError
from django.test import TestCase


class HealthEndpointTests(TestCase):
    def test_health_returns_ok(self):
        response = self.client.get("/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "service": "mls-backend",
            },
        )

    def test_readiness_returns_ok_when_database_is_available(self):
        response = self.client.get("/health/ready/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "database": "ok",
            },
        )

    @patch("backend.health.connection.cursor")
    def test_readiness_returns_503_when_database_is_unavailable(
        self,
        mock_cursor,
    ):
        mock_cursor.side_effect = DatabaseError("Database unavailable")

        response = self.client.get("/health/ready/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {
                "status": "unavailable",
                "database": "error",
            },
        )

    def test_health_rejects_post_requests(self):
        response = self.client.post("/health/")

        self.assertEqual(response.status_code, 405)