import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import AccessToken
from .helpers import get_access_token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, F, FloatField
from django.db.models.functions import Cast
from django.core.paginator import Paginator
from django.utils import timezone
from datetime import timedelta
from mls.models import Property
from .serializers import PropertySerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, FloatField
from django.db.models.functions import Cast, Substr, Lower
from django.core.paginator import Paginator
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests

from .helpers import fetch_properties_by_property_data
from mls.models import Property
from .serializers import PropertySerializer

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
        
class DDFAPIClient:
    def make_api_call(self, endpoint, params=None):
        """
        Makes an API call to the DDF® Web API
        """
        DDF_API_URL = 'https://ddfapi.realtor.ca/odata/v1'
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
            "$orderby": request.GET.get('$orderby', 'ModificationTimestamp desc'),  # Default sorting by price desc
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
            fetch_properties_by_property_data.delay(property_data)
            return Response(property_data, status=status.HTTP_200_OK)

        except Exception as e:
            # Handle the error and return it in a readable format
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class ExclusivePropertiesAPIView(APIView):
    """
    GET /api/exclusive-properties/
    Only listings with "exclusive" in the FIRST 400 characters (~25–35 words)
    """

    def get_queryset(self, params):
        limit = min(int(params.get('limit', 6)), 100)
        offset = int(params.get('offset', 0))

        # CHECK ONLY FIRST 400 CHARS FOR "exclusive" (case-insensitive)
        base_qs = Property.objects.annotate(
            intro=Lower(Substr('public_remarks', 1, 400))
        ).filter(
            Q(intro__contains='exclusive') |
            Q(category_type=Property.EXCLUSIVE)
        ).distinct()

        # Auto-tag any new ones found in intro
        to_tag = base_qs.filter(intro__contains='exclusive') \
                        .exclude(category_type=Property.EXCLUSIVE)
        updated_count = 0
        if to_tag.exists():
            updated_count = to_tag.update(category_type=Property.EXCLUSIVE)

        # Start with all properties
        q = Property.objects.all()

        # === ALL REALTOR.CA FILTERS ===
        if params.get('price_min'):
            q = q.filter(list_price__gte=float(params['price_min']))
        if params.get('price_max'):
            q = q.filter(list_price__lte=float(params['price_max']))

        if params.get('bedrooms'):
            q = q.filter(bedrooms_total__gte=int(params['bedrooms']))
        if params.get('bathrooms'):
            q = q.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

        if params.get('property_type'):
            types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
            if types:
                q = q.filter(property_sub_type__in=types)

        if params.get('city'):
            cities = [c.strip() for c in params['city'].split(',') if c.strip()]
            if cities:
                q = q.filter(city__in=cities)

        if params.get('province'):
            provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
            if provinces:
                q = q.filter(state_or_province__in=provinces)

        if params.get('postal_code'):
            codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
            if codes:
                q = q.filter(postal_code__in=codes)

        # Map bounding box
        if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
            q = q.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(params['latitude_min']),
                lat_float__lte=float(params['latitude_max']),
                lng_float__gte=float(params['longitude_min']),
                lng_float__lte=float(params['longitude_max']),
            )

        if params.get('building_area_min'):
            q = q.filter(building_area_total__gte=float(params['building_area_min']))
        if params.get('lot_size_min'):
            q = q.filter(lot_size_area__gte=float(params['lot_size_min']))
        if params.get('year_built_min'):
            q = q.filter(year_built__gte=int(params['year_built_min']))

        if params.get('keywords'):
            keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(public_remarks__icontains=kw)
            q = q.filter(kw_q)

        if params.get('has_photos') in ('true', '1', 'True'):
            q = q.filter(photos_count__gt=0)

        if params.get('new_listings_days'):
            days = int(params['new_listings_days'])
            cutoff = timezone.now() - timedelta(days=days)
            q = q.filter(modification_timestamp__gte=cutoff)

        if params.get('standard_status'):
            q = q.filter(standard_status=params['standard_status'])

        # Final: must be exclusive (by intro or tag)
        final_qs = q.filter(id__in=base_qs.values('id')) \
                    .distinct() \
                    .order_by('-modification_timestamp', '-list_price')

        return final_qs, limit, offset, updated_count

    def get(self, request):
        qs, limit, offset, updated = self.get_queryset(request.query_params)
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        return Response({
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "updated_to_exclusive": updated,
            "results": serializer.data
        })