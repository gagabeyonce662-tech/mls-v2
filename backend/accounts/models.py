import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    avatar_url = models.URLField(blank=True, null=True)
    facebook_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    ghl_contact_id = models.CharField(max_length=255, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    # Blog Studio access, deliberately SEPARATE from is_staff: a writer needs to
    # publish posts, not to reach the Django admin and the MLS tables behind it.
    can_author = models.BooleanField(
        default=False,
        help_text="May create, edit and publish blog posts in the Studio.",
    )
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    objects = UserManager()

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def can_use_studio(self) -> bool:
        """Single source of truth for Studio access.

        Staff keep access so existing admins are not locked out by the new flag.
        """
        return bool(self.is_staff or self.can_author)


class PasswordResetToken(models.Model):
    """
    A one-time UUID token used to reset a forgotten password.

    Deliberately short-lived (1 hour, against the 24 of email verification):
    it grants account access, so the window to abuse a leaked link is kept
    small. `used_at` makes the token single-use even inside that window, so a
    link sitting in an inbox cannot be replayed after the password is changed.
    """
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', '-created_at'])]

    def save(self, *args, **kwargs):
        if not self.pk and not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(hours=1)
        super().save(*args, **kwargs)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def is_usable(self) -> bool:
        return self.used_at is None and not self.is_expired()


class EmailVerificationToken(models.Model):
    """
    A one-time UUID token used to verify a user's email address.
    Automatically expires 24 hours after creation.
    """
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='email_verification_token',
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # set to created_at + 24h on save

    def save(self, *args, **kwargs):
        if not self.pk and not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"VerifyToken({self.user.email}, expires={self.expires_at})"

    class Meta:
        verbose_name = 'Email Verification Token'
        verbose_name_plural = 'Email Verification Tokens'
