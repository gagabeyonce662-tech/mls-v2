from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    phone = serializers.CharField()

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        name_parts = validated_data['name'].strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone=validated_data.get('phone'),
        )


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
