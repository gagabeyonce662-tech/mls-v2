import logging
import requests
from django.contrib.auth import get_user_model, authenticate
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from drf_spectacular.utils import (
    OpenApiResponse,
    OpenApiTypes,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
try:
    from twilio.rest import Client as TwilioClient
    from twilio.base.exceptions import TwilioRestException
    _twilio_available = True
except ImportError:
    _twilio_available = False

from .models import EmailVerificationToken
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    FacebookAuthSerializer,
    UserProfileSerializer,
    ResendVerificationSerializer,
)
from .services import create_ghl_contact, update_ghl_contact
from .tasks import _send_now as _send_verification_email

logger = logging.getLogger(__name__)
User = get_user_model()

# Max resend attempts per email per hour (anti-spam).
_RESEND_RATE_LIMIT = 3
_RESEND_WINDOW_SECONDS = 3600


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


def _issue_token_and_respond(user, extra: dict = None):
    """Return a 200 response with JWT pair + user profile."""
    tokens = get_tokens_for_user(user)
    data = {
        'user': UserProfileSerializer(user).data,
        **tokens,
    }
    if extra:
        data.update(extra)
    return Response(data)


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@extend_schema_view(post=extend_schema(tags=["Authentication"], summary="Register an account", request=RegisterSerializer, responses={201: OpenApiResponse(description="Account created; email verification is required."), 400: OpenApiResponse(description="Invalid registration request.")}, auth=[]))
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Creates user with is_active=False (default in model).
        user = serializer.save()

        # Create GHL contact immediately (per confirmed requirement).
        contact_id = create_ghl_contact(
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
        )
        if contact_id:
            user.ghl_contact_id = contact_id
            user.save(update_fields=['ghl_contact_id'])

        # Create a 24-hour verification token and fire the async email.
        token_obj = EmailVerificationToken.objects.create(user=user)
        # Send verification email synchronously (like Twilio OTP — no broker needed).
        _send_verification_email(user.id, str(token_obj.token))

        return Response(
            {'detail': 'Registration successful. Check your email to verify your account.'},
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@extend_schema_view(post=extend_schema(tags=["Authentication"], summary="Sign in", request=LoginSerializer, responses={200: OpenApiTypes.OBJECT, 400: OpenApiResponse(description="Invalid login request."), 401: OpenApiResponse(description="Invalid credentials."), 403: OpenApiResponse(description="Email verification is required.")}, auth=[]))
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
            # Distinguish "wrong password" from "not verified" for UX.
            unverified = User.objects.filter(
                email=serializer.validated_data['email'].lower(),
                is_active=False,
            ).first()
            if unverified:
                return Response(
                    {'detail': 'Please verify your email address before logging in.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response(
                {'detail': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return _issue_token_and_respond(user)


# ---------------------------------------------------------------------------
# Email Verification
# ---------------------------------------------------------------------------

@extend_schema_view(get=extend_schema(tags=["Authentication"], summary="Verify an email address", responses={200: OpenApiTypes.OBJECT, 404: OpenApiResponse(description="Verification token was not found."), 410: OpenApiResponse(description="Verification token expired.")}, auth=[]))
class VerifyEmailView(APIView):
    """
    GET /api/auth/verify-email/<uuid:token>/

    Validates the token:
      - Valid & not expired → activates user, deletes token, returns JWT pair (auto-login).
      - Expired           → 410 Gone.
      - Not found         → 404.
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(token=token)
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {'detail': 'Verification link is invalid or has already been used.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if token_obj.is_expired():
            token_obj.delete()
            return Response(
                {
                    'detail': (
                        'This verification link has expired. '
                        'Please request a new one.'
                    ),
                    'resend_required': True,
                },
                status=status.HTTP_410_GONE,
            )

        user = token_obj.user
        user.is_active = True
        user.save(update_fields=['is_active'])
        token_obj.delete()

        logger.info("Email verified for user %s (id=%s)", user.email, user.pk)

        # Auto-login: return JWT pair.
        return _issue_token_and_respond(user, extra={'detail': 'Email verified successfully.'})


# ---------------------------------------------------------------------------
# Resend Verification
# ---------------------------------------------------------------------------

@extend_schema_view(post=extend_schema(tags=["Authentication"], summary="Resend email verification", request=ResendVerificationSerializer, responses={200: OpenApiResponse(description="Verification request accepted."), 400: OpenApiResponse(description="Invalid request.")}, auth=[]))
class ResendVerificationView(APIView):
    """
    POST /api/auth/resend-verification/   Body: {"email": "..."}

    Rate-limited to 3 resends per email per hour.
    Always returns 200 to avoid user enumeration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()
        cache_key = f"resend_verify:{email}"

        # --- Rate-limit check ---
        attempts = cache.get(cache_key, 0)
        if attempts >= _RESEND_RATE_LIMIT:
            # Still return 200 to avoid enumeration, but do nothing.
            logger.warning("Resend verification rate-limited for %s", email)
            return Response(
                {'detail': 'If an unverified account exists, a new link has been sent.'},
                status=status.HTTP_200_OK,
            )

        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            # No unverified user — return 200 silently.
            return Response(
                {'detail': 'If an unverified account exists, a new link has been sent.'},
                status=status.HTTP_200_OK,
            )

        # Invalidate any existing token.
        EmailVerificationToken.objects.filter(user=user).delete()

        # Create fresh token and send email.
        token_obj = EmailVerificationToken.objects.create(user=user)
        _send_verification_email(user.id, str(token_obj.token))

        # Increment rate-limit counter.
        cache.set(cache_key, attempts + 1, timeout=_RESEND_WINDOW_SECONDS)

        logger.info("Verification email resent to %s", email)
        return Response(
            {'detail': 'If an unverified account exists, a new link has been sent.'},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

@extend_schema_view(post=extend_schema(tags=["Authentication"], summary="Authenticate with Google", request=GoogleAuthSerializer, responses={200: OpenApiTypes.OBJECT, 400: OpenApiResponse(description="Google authentication failed.")}, auth=[]))
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
                # Existing email user — link Google account; also activate if not yet active.
                update_fields = ['google_id']
                user.google_id = google_id
                if not user.is_active:
                    user.is_active = True
                    update_fields.append('is_active')
                    # Clean up any pending verification token.
                    EmailVerificationToken.objects.filter(user=user).delete()
                user.save(update_fields=update_fields)
            else:
                # Brand new user via Google — email is provider-verified → is_active=True.
                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    google_id=google_id,
                    is_active=True,   # skip email verification for OAuth
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


# ---------------------------------------------------------------------------
# Facebook OAuth
# ---------------------------------------------------------------------------

@extend_schema_view(post=extend_schema(tags=["Authentication"], summary="Authenticate with Facebook", request=FacebookAuthSerializer, responses={200: OpenApiTypes.OBJECT, 400: OpenApiResponse(description="Facebook authentication failed.")}, auth=[]))
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
                update_fields = ["facebook_id"]
                user.facebook_id = facebook_id
                if not user.is_active:
                    user.is_active = True
                    update_fields.append('is_active')
                    EmailVerificationToken.objects.filter(user=user).delete()
                user.save(update_fields=update_fields)
            else:
                # Brand new user via Facebook — email is provider-verified → is_active=True.
                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    facebook_id=facebook_id,
                    is_active=True,   # skip email verification for OAuth
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


# ---------------------------------------------------------------------------
# Twilio OTP helpers
# ---------------------------------------------------------------------------

def _get_twilio_client():
    sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    service = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', '')
    if not _twilio_available:
        return None, None, 'twilio package is not installed'

    missing = [
        name
        for name, value in (
            ('TWILIO_ACCOUNT_SID', sid),
            ('TWILIO_AUTH_TOKEN', token),
            ('TWILIO_VERIFY_SERVICE_SID', service),
        )
        if not value
    ]
    if missing:
        return None, None, f"missing {', '.join(missing)}"

    return TwilioClient(sid, token), service, ''


@extend_schema_view(post=extend_schema(tags=["Authentication"], summary="Send a phone verification code", request=inline_serializer(name="SendOtpRequest", fields={"phone": serializers.CharField()}), responses={200: OpenApiResponse(description="Verification code sent."), 400: OpenApiResponse(description="Invalid phone request."), 401: OpenApiResponse(description="Authentication is required."), 503: OpenApiResponse(description="SMS service is unavailable.")}))
class SendOtpView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone = (request.data.get('phone') or '').strip()
        if not phone:
            return Response({'detail': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        client, service_sid, config_error = _get_twilio_client()
        if not client:
            logger.error('Twilio send OTP is not configured: %s', config_error)
            return Response({'detail': 'SMS service is not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            client.verify.v2.services(service_sid).verifications.create(
                to=phone,
                channel='sms',
            )
        except TwilioRestException as e:
            logger.warning('Twilio send OTP failed for %s: %s', phone, e)
            return Response({'detail': str(e.msg)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Verification code sent.'})


@extend_schema_view(post=extend_schema(tags=["Authentication"], summary="Verify a phone code", request=inline_serializer(name="VerifyOtpRequest", fields={"phone": serializers.CharField(), "code": serializers.CharField()}), responses={200: UserProfileSerializer, 400: OpenApiResponse(description="Invalid or expired verification code."), 401: OpenApiResponse(description="Authentication is required."), 503: OpenApiResponse(description="SMS service is unavailable.")}))
class VerifyOtpView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone = (request.data.get('phone') or '').strip()
        code = (request.data.get('code') or '').strip()
        if not phone or not code:
            return Response({'detail': 'Phone and code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        client, service_sid, config_error = _get_twilio_client()
        if not client:
            logger.error('Twilio verify OTP is not configured: %s', config_error)
            return Response({'detail': 'SMS service is not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            check = client.verify.v2.services(service_sid).verification_checks.create(
                to=phone,
                code=code,
            )
        except TwilioRestException as e:
            logger.warning('Twilio verify OTP failed for %s: %s', phone, e)
            return Response({'detail': str(e.msg)}, status=status.HTTP_400_BAD_REQUEST)

        if check.status != 'approved':
            return Response({'detail': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.phone = phone
        user.phone_verified = True
        user.save(update_fields=['phone', 'phone_verified'])

        return Response(UserProfileSerializer(user).data)


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@extend_schema_view(
    get=extend_schema(tags=["Authentication"], summary="Retrieve the account profile", responses={200: UserProfileSerializer, 401: OpenApiResponse(description="Authentication is required.")}),
    put=extend_schema(tags=["Authentication"], summary="Update the account profile", request=UserProfileSerializer, responses={200: UserProfileSerializer, 400: OpenApiResponse(description="Invalid profile request."), 401: OpenApiResponse(description="Authentication is required.")}),
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

        if "phone" in changed:
            user.phone_verified = False
            user.save(update_fields=["phone_verified"])

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
