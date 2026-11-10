"""Staff editor and public read for connection settings."""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from vlog.permissions import IsStaffUser

from .runtime_config import public_payload, save_values, staff_payload


class PublicIntegrationsView(APIView):
    """GET /api/home/integrations/public/ — ids the website may show."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(public_payload())


class StudioIntegrationsView(APIView):
    """GET/PUT /api/home/studio/integrations/ — staff only."""

    permission_classes = [IsStaffUser]

    def get(self, request):
        return Response(staff_payload())

    def put(self, request):
        body = request.data if isinstance(request.data, dict) else {}
        incoming = body.get("values") if isinstance(body.get("values"), dict) else {}
        clear = body.get("clear") if isinstance(body.get("clear"), list) else []
        clear = [key for key in clear if isinstance(key, str)]
        save_values(incoming, clear)
        return Response(staff_payload())
