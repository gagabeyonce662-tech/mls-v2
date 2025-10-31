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
            '$top': 100,  
            '$orderby': 'ListPrice desc'
        }
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                properties = response.json().get('value', [])
                print("Total Properties:", len(properties)) 
                return Response(properties, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Failed to fetch data' , "res":response.json()}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests

DDF_API_URL = 'https://ddfapi.realtor.ca/odata/v1'
AUTH_URL = 'https://identity.crea.ca/connect/token'
CLIENT_ID = 'your_client_id'  # Replace with your actual client_id
CLIENT_SECRET = 'your_client_secret'  # Replace with your actual client_secret


class DDFAPIClient:


    def make_api_call(self, endpoint, params=None):
        """
        Makes an API call to the DDF® Web API
        """
        access_token = get_access_token()
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(f'{DDF_API_URL}/{endpoint}', headers=headers, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error {response.status_code}: {response.text}")

class PropertyFilterView(APIView):
    """
    Fetches a list of properties from DDF® API with multiple filters
    """

    def get(self, request):
        # Collecting all possible filters from request params
        filters = {
            "$top": request.GET.get('$top', 100),  # Limit number of results, default to 100
            "$skip": request.GET.get('$skip', 0),  # Pagination skip, default to 0
            "$orderby": request.GET.get('$orderby', 'ListPrice desc'),  # Default sorting by price desc
            # "$select": request.GET.get('$select', 'ListingKey,PropertySubType,ListPrice,City,StateOrProvince'),  # Default fields to select
        }
        
        # List to accumulate filter conditions
        filter_conditions = []

        # Function to append filter condition
        def add_filter(field, operator, value):
            """Helper function to add filter conditions."""
            if value:
                filter_conditions.append(f"{field} {operator} {value}")

        # Price Min filter
        if 'price_min' in request.GET:
            add_filter("ListPrice", "ge", request.GET['price_min'])

        # Price Max filter
        if 'price_max' in request.GET:
            add_filter("ListPrice", "le", request.GET['price_max'])

        # Bedrooms filter
        if 'bedrooms' in request.GET:
            add_filter("BedroomsTotal", "eq", request.GET['bedrooms'])

        # Bathrooms filter
        if 'bathrooms' in request.GET:
            add_filter("BathroomsTotalInteger", "eq", request.GET['bathrooms'])

        # City filter
        if 'city' in request.GET:
            add_filter("City", "eq", f"'{request.GET['city']}'")

        # Province filter
        if 'province' in request.GET:
            add_filter("StateOrProvince", "eq", f"'{request.GET['province']}'")

        # Status filter
        if 'status' in request.GET:
            add_filter("StandardStatus", "eq", f"'{request.GET['status']}'")

        # Modified Since filter
        if 'modified_since' in request.GET:
            add_filter("ModificationTimestamp", "ge", request.GET['modified_since'])

        # PropertySubType filter (fixed)
        if 'property_subtype' in request.GET:
            add_filter("PropertySubType", "eq", f"'{request.GET['property_subtype']}'")

        # Combine all filter conditions with 'and' if any are provided
        if filter_conditions:
            filters["$filter"] = " and ".join(filter_conditions)

        try:
            # Make the API call to DDF
            ddf_client = DDFAPIClient()
            properties = ddf_client.make_api_call('Property', filters)

            # Return the response
            return Response(properties, status=status.HTTP_200_OK)

        except Exception as e:
            # Handle errors and return appropriate response
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PropertyDetailView(APIView):
    """
    Fetches a single property from DDF® API by PropertyKey.
    Supports both path-style and function-style access.
    """

    def get(self, request, PropertyKey):
        # Validate PropertyKey
        if not PropertyKey:
            return Response({"error": "PropertyKey is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Building filters for the DDF® API
        filters = {
            "$select": request.GET.get('$select', '*'),  # Default to all fields if $select not provided
        }

        try:
            # Make the API call to get the property details by PropertyKey
            ddf_client = DDFAPIClient()
            property_data = ddf_client.make_api_call(f'Property/{PropertyKey}', filters)
            
            # Check if the property data is valid
            if not property_data:
                return Response({"error": "Property not found for the given PropertyKey."}, status=status.HTTP_404_NOT_FOUND)

            return Response(property_data, status=status.HTTP_200_OK)

        except Exception as e:
            # Handle the error and return it in a readable format
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
class PropertyListView(APIView):
    """
    Fetches a list of properties for all destinations from the DDF® API.
    Supports filtering, sorting, and pagination via query parameters.
    """
    
    def get(self, request):
        # Collecting filters and query parameters from the request
        filters = {
            # "$top": request.GET.get('$top', 100),  # Limit number of results, default to 100
            "$orderby": request.GET.get('$orderby', 'ModificationTimestamp desc'),  # Default sorting by ListPrice
            "$select": request.GET.get('$select', '*'),  # Default to select all fields if $select not provided
            "$count": request.GET.get('$count', 'false')  # Whether to return the total count
        }
        
        # Initialize the filter string
        filter_string = ""

        # Apply custom filter if provided
        if '$filter' in request.GET:
            filter_string = request.GET["$filter"]  # Apply filter if provided

        # Additional filters for price, bedrooms, bathrooms, etc.
        if 'price_min' in request.GET:
            filter_string += f" and ListPrice ge {request.GET['price_min']}"
        
        if 'price_max' in request.GET:
            filter_string += f" and ListPrice le {request.GET['price_max']}"
        
        if 'bedrooms' in request.GET:
            filter_string += f" and BedroomsTotal eq {request.GET['bedrooms']}"
        
        if 'bathrooms' in request.GET:
            filter_string += f" and BathroomsTotalInteger eq {request.GET['bathrooms']}"
        
        if 'city' in request.GET:
            filter_string += f" and City eq '{request.GET['city']}'"
        
        if 'province' in request.GET:
            filter_string += f" and StateOrProvince eq '{request.GET['province']}'"
        
        if 'status' in request.GET:
            filter_string += f" and StandardStatus eq '{request.GET['status']}"
        
        # If PropertySubType filter is still desired, make sure the field is correct
        if 'property_subtype' in request.GET:
            filter_string += f" and PropertySubType eq '{request.GET['property_subtype']}'"

        # Set the filter string in the filters dictionary
        if filter_string:
            filters["$filter"] = filter_string.lstrip(" and ")  # Strip leading "and"

        try:
            ddf_client = DDFAPIClient()
            # Path-style access to fetch all properties for destinations
            properties = ddf_client.make_api_call('Property/PropertyReplication', filters)
            return Response(properties, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PropertyDetailByDestinationView(APIView):
    """
    Fetches a list of properties for a single destination from the DDF® API.
    DestinationId is required to fetch properties for a specific destination.
    """

    def get(self, request, DestinationId):
        # Validate DestinationId
        if not DestinationId:
            return Response({"error": "DestinationId is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Collecting filters and query parameters from the request
        filters = {
            "$top": request.GET.get('$top', 100),  # Limit number of results, default to 100
            "$skip": request.GET.get('$skip', 0),  # Pagination skip, default to 0
            "$orderby": request.GET.get('$orderby', 'ListPrice desc'),  # Default sorting by ListPrice
            "$select": request.GET.get('$select', '*'),  # Default to select all fields if $select not provided
            "$count": request.GET.get('$count', 'false')  # Whether to return the total count
        }

        if '$filter' in request.GET:
            filters["$filter"] = request.GET["$filter"]  # Apply filter if provided

        try:
            ddf_client = DDFAPIClient()
            # Function-style access to fetch properties for a specific destination
            properties = ddf_client.make_api_call(f'Property/PropertyReplication/{DestinationId})')
            return Response(properties, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)