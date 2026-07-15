from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, extend_schema_view

from .views import (
    RegisterView,
    LoginView,
    GoogleAuthView,
    FacebookAuthView,
    ProfileView,
    SendOtpView,
    VerifyOtpView,
    VerifyEmailView,
    ResendVerificationView,
)


@extend_schema_view(
    post=extend_schema(tags=["Authentication"], summary="Refresh an access token")
)
class AuthenticationTokenRefreshView(TokenRefreshView):
    pass

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('google/', GoogleAuthView.as_view(), name='auth-google'),
    path('facebook/', FacebookAuthView.as_view(), name='auth-facebook'),
    path('token/refresh/', AuthenticationTokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('send-otp/', SendOtpView.as_view(), name='auth-send-otp'),
    path('verify-otp/', VerifyOtpView.as_view(), name='auth-verify-otp'),

    # Email verification
    path('verify-email/<uuid:token>/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='auth-resend-verification'),
]
