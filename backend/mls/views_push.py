"""Web push subscription storage (scope #5b)."""

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from mls.models import WebPushSubscription
from mls.services.request_meta import user_agent
from mls.services.web_push import vapid_configured, vapid_public_key


class PushVapidAPIView(APIView):
    """GET /api/mls/push/vapid/ — the public key, or enabled: false."""

    permission_classes = [AllowAny]

    def get(self, request):
        key = vapid_public_key()
        return Response({"enabled": vapid_configured(), "public_key": key})


class PushSubscribeAPIView(APIView):
    """POST stores a subscription; DELETE removes one owned by this user."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not vapid_public_key():
            return Response({"error": "Push is not configured."}, status=503)
        data = request.data if isinstance(request.data, dict) else {}
        endpoint = str(data.get("endpoint") or "").strip()
        keys = data.get("keys") if isinstance(data.get("keys"), dict) else {}
        p256dh = str(keys.get("p256dh") or "").strip()
        auth = str(keys.get("auth") or "").strip()
        if not endpoint.startswith("https://") or not p256dh or not auth:
            return Response({"error": "A valid push subscription is required."}, status=400)
        if len(p256dh) > 255 or len(auth) > 255 or len(endpoint) > 2000:
            return Response({"error": "Subscription is too long."}, status=400)

        sub, _created = WebPushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                "user": request.user,
                "p256dh": p256dh,
                "auth": auth,
                "user_agent": user_agent(request),
            },
        )
        return Response({"id": sub.pk}, status=201)

    def delete(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        endpoint = str(data.get("endpoint") or "").strip()
        deleted, _ = WebPushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        if not deleted:
            return Response(status=404)
        return Response(status=204)
