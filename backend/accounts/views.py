import logging
import requests
from django.contrib.auth import get_user_model, authenticate
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    FacebookAuthSerializer,
    UserProfileSerializer,
)
from .services import create_ghl_contact, update_ghl_contact

logger = logging.getLogger(__name__)
User = get_user_model()


def _facebook_allowed_redirect_uris():
    """URIs that may be used in the OAuth dialog and token exchange (must match exactly)."""
    uris = set()
    default = (getattr(settings, "FACEBOOK_REDIRECT_URI", "") or "").strip()
    if default:
        uris.add(default)
    extra = (getattr(settings, "FACEBOOK_ALLOWED_REDIRECT_URIS", "") or "").strip()
    for part in extra.split(","):
        u = part.strip()
        if u:
            uris.add(u)
    return uris


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Create GHL contact with name, email, phone
        contact_id = create_ghl_contact(
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
        )
        if contact_id:
            user.ghl_contact_id = contact_id
            user.save(update_fields=['ghl_contact_id'])

        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            **tokens,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(
            request,
            username=serializer.validated_data['email'].lower(),
            password=serializer.validated_data['password'],
        )
        if not user:
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            **tokens,
        })


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        raw_token = (serializer.validated_data.get('id_token') or '').strip()
        auth_code = (serializer.validated_data.get('code') or '').strip()

        # OAuth code flow: exchange auth code for id_token on backend
        if auth_code and not raw_token:
            client_secret = (getattr(settings, "GOOGLE_CLIENT_SECRET", "") or "").strip()
            if not client_secret:
                return Response(
                    {'detail': 'GOOGLE_CLIENT_SECRET is not configured.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            try:
                token_response = requests.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": auth_code,
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": client_secret,
                        "redirect_uri": "postmessage",
                        "grant_type": "authorization_code",
                    },
                    timeout=10,
                )
                token_response.raise_for_status()
                token_data = token_response.json()
                raw_token = token_data.get("id_token", "").strip()
                if not raw_token:
                    logger.warning("Google code exchange succeeded without id_token.")
                    return Response(
                        {'detail': 'Failed to obtain id_token from Google.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except requests.RequestException as e:
                logger.warning(f"Google code exchange failed: {e}")
                return Response(
                    {'detail': 'Google OAuth code exchange failed.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            id_info = google_id_token.verify_oauth2_token(
                raw_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as e:
            logger.warning(f'Google token verification failed: {e}')
            return Response({'detail': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

        google_id = id_info['sub']
        email = id_info.get('email', '').lower()
        first_name = id_info.get('given_name', '')
        last_name = id_info.get('family_name', '')

        # Try to find by google_id first, then by email
        user = User.objects.filter(google_id=google_id).first()
        is_new = False

        if not user:
            user = User.objects.filter(email=email).first()
            if user:
                # Existing email user — link Google account
                user.google_id = google_id
                user.save(update_fields=['google_id'])
            else:
                # Brand new user via Google
                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    google_id=google_id,
                )
                is_new = True

                # Create GHL contact with name + email (no phone yet)
                contact_id = create_ghl_contact(
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                )
                if contact_id:
                    user.ghl_contact_id = contact_id
                    user.save(update_fields=['ghl_contact_id'])

        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'is_new_user': is_new,
            **tokens,
        })


class FacebookAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FacebookAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        auth_code = (serializer.validated_data.get("code") or "").strip()
        redirect_uri_override = (serializer.validated_data.get("redirect_uri") or "").strip()

        app_id = (getattr(settings, "FACEBOOK_APP_ID", "") or "").strip()
        app_secret = (getattr(settings, "FACEBOOK_APP_SECRET", "") or "").strip()
        graph_version = (getattr(settings, "FACEBOOK_GRAPH_VERSION", "v19.0") or "v19.0").strip().lstrip("/")

        if not app_id or not app_secret:
            return Response(
                {"detail": "Facebook OAuth is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        allowed = _facebook_allowed_redirect_uris()
        if not allowed:
            return Response(
                {"detail": "FACEBOOK_REDIRECT_URI is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        default_redirect = (getattr(settings, "FACEBOOK_REDIRECT_URI", "") or "").strip()
        if redirect_uri_override:
            redirect_uri = redirect_uri_override
        elif default_redirect and default_redirect in allowed:
            redirect_uri = default_redirect
        else:
            redirect_uri = sorted(allowed)[0]

        if redirect_uri not in allowed:
            return Response(
                {"detail": "Invalid redirect_uri."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_url = f"https://graph.facebook.com/{graph_version}/oauth/access_token"
        try:
            token_response = requests.get(
                token_url,
                params={
                    "client_id": app_id,
                    "redirect_uri": redirect_uri,
                    "client_secret": app_secret,
                    "code": auth_code,
                },
                timeout=10,
            )
            token_response.raise_for_status()
            token_data = token_response.json()
        except requests.RequestException as e:
            logger.warning("Facebook code exchange failed: %s", e)
            return Response(
                {"detail": "Facebook OAuth code exchange failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        access_token = (token_data.get("access_token") or "").strip()
        if not access_token:
            logger.warning("Facebook code exchange returned no access_token: %s", token_data)
            return Response(
                {"detail": "Facebook OAuth code exchange failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        me_url = f"https://graph.facebook.com/{graph_version}/me"
        try:
            me_response = requests.get(
                me_url,
                params={
                    "fields": "id,email,first_name,last_name",
                    "access_token": access_token,
                },
                timeout=10,
            )
            me_response.raise_for_status()
            profile = me_response.json()
        except requests.RequestException as e:
            logger.warning("Facebook /me request failed: %s", e)
            return Response(
                {"detail": "Failed to fetch Facebook profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        facebook_id = str(profile.get("id") or "").strip()
        email = (profile.get("email") or "").strip().lower()
        first_name = (profile.get("first_name") or "").strip()
        last_name = (profile.get("last_name") or "").strip()

        if not facebook_id:
            return Response(
                {"detail": "Invalid Facebook profile response."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not email:
            return Response(
                {
                    "detail": (
                        "Facebook did not return an email. Please grant email permission and try again."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(facebook_id=facebook_id).first()
        is_new = False

        if not user:
            user = User.objects.filter(email=email).first()
            if user:
                user.facebook_id = facebook_id
                user.save(update_fields=["facebook_id"])
            else:
                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    facebook_id=facebook_id,
                )
                is_new = True

                contact_id = create_ghl_contact(
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                )
                if contact_id:
                    user.ghl_contact_id = contact_id
                    user.save(update_fields=["ghl_contact_id"])

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": UserProfileSerializer(user).data,
                "is_new_user": is_new,
                **tokens,
            }
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def put(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Detect which fields changed so we only push real updates to GHL
        changed = {
            field: serializer.validated_data[field]
            for field in serializer.validated_data
            if getattr(user, field) != serializer.validated_data[field]
        }

        serializer.save()

        # Sync any changed fields to GHL
        if changed and user.ghl_contact_id:
            update_ghl_contact(user.ghl_contact_id, **changed)
        elif changed and not user.ghl_contact_id:
            # Contact was never created — try creating it now
            contact_id = create_ghl_contact(
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                phone=user.phone,
            )
            if contact_id:
                user.ghl_contact_id = contact_id
                user.save(update_fields=['ghl_contact_id'])

        return Response(UserProfileSerializer(user).data)
