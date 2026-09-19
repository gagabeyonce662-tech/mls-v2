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
    name = serializers.SerializerMethodField()
    avatar = serializers.URLField(source="avatar_url", read_only=True, allow_null=True)
    can_use_studio = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        # `is_staff` / `can_author` are exposed so the frontend knows whether to
        # offer the Studio. They are READ-ONLY here: privilege is granted through
        # the team endpoints or Django admin, never by a user PATCHing their own
        # profile.
        fields = (
            'id', 'name', 'email', 'phone', 'phone_verified', 'avatar',
            'date_joined', 'is_staff', 'can_author', 'can_use_studio',
        )
        read_only_fields = (
            'id', 'email', 'phone_verified', 'avatar', 'date_joined',
            'is_staff', 'can_author', 'can_use_studio',
        )

    def get_name(self, obj) -> str:
        return obj.full_name


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
