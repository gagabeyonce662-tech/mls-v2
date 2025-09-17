import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import AccessToken
from .helpers import get_access_token












class FetchProperties(APIView):
    """
    API view to fetch properties from the REALTOR.ca API
    """

    def get(self, request):
        access_token = get_access_token()
        
        if not access_token:
            return Response({'error': 'Failed to authenticate'}, status=status.HTTP_401_UNAUTHORIZED)
        url = 'https://ddfapi.realtor.ca/odata/v1/Property'
        headers = {'Authorization': f'Bearer {access_token}'}
        params = {
            '$top': 5,  
            '$orderby': 'ListPrice desc'
        }
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                properties = response.json().get('value', [])
                return Response(properties, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Failed to fetch data'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)