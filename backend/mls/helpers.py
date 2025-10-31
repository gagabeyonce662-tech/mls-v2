import requests
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta



def regenerate_access_token():
    """
    This function makes a request to CREA's authentication server and returns
    the token data (access token, refresh token, and their expiration times).
    """
    url = 'https://identity.crea.ca/connect/token'
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'grant_type': 'client_credentials',
        'client_id': settings.CLIENT_ID, 
        'client_secret': settings.CLIENT_SECRET,  
        'scope': 'DDFApi_Read'
    }

    response = requests.post(url, data=data, headers=headers)

    if response.status_code == 200:
        token_data = response.json()  
        
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        access_token_expires_in = token_data.get('expires_in', 3600)  # Default to 3600 seconds if not provided
        refresh_token_expires_in = token_data.get('refresh_token_expires_in', 3600)  # Default to 3600 seconds if not provided
        
        # Define current_time before using it
        current_time = datetime.now()

        # Calculate expiration times
        access_token_expiry = current_time + timedelta(seconds=access_token_expires_in)
        refresh_token_expiry = current_time + timedelta(seconds=refresh_token_expires_in)

        # Print the expiration times for debugging
        print(f"Access token expires at: {access_token_expiry}")
        print(f"Refresh token expires at: {refresh_token_expiry}")

        # Create the AccessToken instance
        from mls.models import AccessToken
        if access_token:
            token = AccessToken.objects.create(
                access_token=access_token,
                refresh_token=refresh_token,
                access_token_expires_at=access_token_expiry,  # Store as DateTime
                refresh_token_expires_at=refresh_token_expiry  # Store as DateTime
            )
        
        print(token)
        return token
    else:
        return None



def regenerate_access_token_with_refresh_token(refresh_token):
    """
    Uses the refresh token to request a new access token and refresh token.
    """
    url = 'https://identity.crea.ca/connect/token'
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': settings.CLIENT_ID,
        'client_secret': settings.CLIENT_SECRET,
        'scope': 'DDFApi_Read'
    }

    response = requests.post(url, data=data, headers=headers)

    if response.status_code == 200:
        return response.json()  
    else:

        return None

def get_access_token():
    """
    This function checks if a valid access token exists in the database.
    If not, it attempts to refresh the token or generate a new one using the refresh token.
    """
    from mls.models import AccessToken
    access_token = AccessToken.get_valid_token()

    if access_token:
        return access_token
    refreshed_token = AccessToken.refresh_access_token()
    if refreshed_token:
        return refreshed_token
    
    token_data = regenerate_access_token()
    if token_data:
        return token_data.access_token
    
    return None
