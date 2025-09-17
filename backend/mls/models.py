from django.db import models
from datetime import timedelta
from django.utils import timezone
from .helpers import regenerate_access_token_with_refresh_token

class AccessToken(models.Model):
    access_token = models.CharField(max_length=512,blank=True, null=True)
    refresh_token = models.CharField(max_length=512, blank=True, null=True)
    access_token_expires_at = models.DateTimeField()
    refresh_token_expires_at = models.DateTimeField()

    def __str__(self):
        return f"Access Token (expires at {self.access_token_expires_at}), Refresh Token (expires at {self.refresh_token_expires_at})"

    @classmethod
    def get_valid_token(cls):
        """
        Returns the valid access token if still valid. Otherwise, returns None.
        """
        token = cls.objects.first()
        if token and token.access_token_expires_at > timezone.now():
            return token.access_token
        return None

    @classmethod
    def regenerate_token(cls, token_data):
        """
        Regenerates both access token and refresh token and saves them to the database.
        """
        token, created = cls.objects.get_or_create(id=1)  
        token.access_token = token_data['access_token']
        token.refresh_token = token_data['refresh_token']
        token.access_token_expires_at = timezone.now() + timedelta(seconds=token_data['access_token_expires_in'])
        token.refresh_token_expires_at = timezone.now() + timedelta(seconds=token_data['refresh_token_expires_in'])
        token.save()
        return token.access_token

    @classmethod
    def refresh_access_token(cls):
        """
        Uses the refresh token to obtain a new access token and refresh token pair.
        """
        token = cls.objects.first()
        if token and token.refresh_token_expires_at > timezone.now():
            # Request a new access token using the refresh token
            token_data = regenerate_access_token_with_refresh_token(token.refresh_token)
            if token_data:
                return cls.regenerate_token(token_data)
        return None
