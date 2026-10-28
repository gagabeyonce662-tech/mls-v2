from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()

# Notification keys accepted on register (HomeAtlasUI AuthModal checkboxes).
# Kept here so RegisterSerializer.create and the view tests share one list.
REGISTER_ALERT_PREF_FIELDS = (
    "email_recommend",
    "email_watched_property",
    "email_watched_community",
    "email_watched_area",
    "push_watched_property",
)


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    phone = serializers.CharField()
    # Required so signup cannot skip Terms & Privacy (UI checkbox).
    agree_terms = serializers.BooleanField()
    # Optional; omit → model defaults (all True). Signup UI sends the accordion state.
    email_recommend = serializers.BooleanField(required=False, default=True)
    email_watched_property = serializers.BooleanField(required=False, default=True)
    email_watched_community = serializers.BooleanField(required=False, default=True)
    email_watched_area = serializers.BooleanField(required=False, default=True)
    push_watched_property = serializers.BooleanField(required=False, default=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_agree_terms(self, value):
        if value is not True:
            raise serializers.ValidationError(
                "You must agree to the Terms & Conditions and Privacy Policy."
            )
        return value

    def create(self, validated_data):
        # Lazy import: accounts must not pull mls at module load (circular apps).
        from mls.models import UserAlertPreference

        prefs = {
            field: validated_data.pop(field, True)
            for field in REGISTER_ALERT_PREF_FIELDS
        }
        validated_data.pop("agree_terms", None)

        name_parts = validated_data['name'].strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone=validated_data.get('phone'),
        )
        # Persist signup choices immediately — the account is inactive until
        # email verify, so the authenticated prefs endpoint is not available yet.
        email_any = any(
            prefs[field]
            for field in REGISTER_ALERT_PREF_FIELDS
            if field.startswith("email_")
        )
        UserAlertPreference.objects.create(
            user=user,
            email_enabled=email_any,
            **prefs,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        id_token = (attrs.get("id_token") or "").strip()
        code = (attrs.get("code") or "").strip()
        if not id_token and not code:
            raise serializers.ValidationError("Either id_token or code is required.")
        return attrs


class FacebookAuthSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, allow_blank=False)
    redirect_uri = serializers.CharField(required=False, allow_blank=True)


class UserProfileSerializer(serializers.ModelSerializer):
    # ``name`` is a legacy read-only convenience; writers should use
    # first_name/last_name so we do not have to guess at how to split.
    name = serializers.SerializerMethodField()
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False)
    avatar = serializers.URLField(source="avatar_url", read_only=True, allow_null=True)
    can_use_studio = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        # `is_staff` / `can_author` are exposed so the frontend knows whether to
        # offer the Studio. They are READ-ONLY here: privilege is granted through
        # the team endpoints or Django admin, never by a user PATCHing their own
        # profile.
        fields = (
            'id', 'name', 'first_name', 'last_name', 'email',
            'phone', 'phone_verified', 'avatar', 'date_joined',
            'is_staff', 'can_author', 'can_use_studio',
        )
        read_only_fields = (
            'id', 'phone_verified', 'avatar', 'date_joined',
            'is_staff', 'can_author', 'can_use_studio',
        )

    def get_name(self, obj) -> str:
        return obj.full_name

    def validate_email(self, value):
        normalized = (value or "").strip().lower()
        if not normalized:
            raise serializers.ValidationError("Email is required.")
        # If unchanged, allow it through without a uniqueness check.
        if self.instance and normalized == (self.instance.email or "").lower():
            return normalized
        if User.objects.exclude(pk=getattr(self.instance, 'pk', None)).filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return normalized


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetRequestSerializer(serializers.Serializer):
    """Step 1 of the reset flow: who is asking."""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Step 2: the token from the email plus the new password.

    `validate_password` applies the same Django password policy as
    registration, so a reset cannot be used to set a weaker password than
    signup would have allowed.
    """
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
