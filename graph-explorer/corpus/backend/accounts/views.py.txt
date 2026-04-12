import logging
from django.contrib.auth import get_user_model, authenticate
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

from .serializers import RegisterSerializer, LoginSerializer, GoogleAuthSerializer, UserProfileSerializer
from .services import create_ghl_contact, update_ghl_contact

logger = logging.getLogger(__name__)
User = get_user_model()


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

        raw_token = serializer.validated_data['id_token']

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
