import requests
from io import BytesIO
import pandas as pd
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, FloatField
from django.db.models.functions import Cast, Substr, Lower
from django.core.paginator import Paginator
from django.utils import timezone

# Local imports
from .models import AccessToken
from .helpers import get_access_token, fetch_properties_by_property_data
from mls.models import Property
from .serializers import PropertySerializer,PropertyDetailSerializer

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
    GET /api/properties/
    
    Full-featured property search using your local Property model (PostgreSQL)
    No DDF API calls → No 400/500 errors → Super fast
    """

    def get(self, request):
        limit = min(int(request.GET.get('limit', 6)), 100)
        offset = int(request.GET.get('offset', 0))

        # Start with all properties
        qs = Property.objects.all()

        # === PRICE ===
        if request.GET.get('price_min'):
            qs = qs.filter(list_price__gte=float(request.GET['price_min']))
        if request.GET.get('price_max'):
            qs = qs.filter(list_price__lte=float(request.GET['price_max']))

        # === BEDS / BATHS ===
        if request.GET.get('bedrooms'):
            qs = qs.filter(bedrooms_total__gte=int(request.GET['bedrooms']))
        if request.GET.get('bathrooms'):
            qs = qs.filter(bathrooms_total_integer__gte=int(request.GET['bathrooms']))

        # === CITY / PROVINCE / POSTAL CODE (multiple) ===
        if request.GET.get('city'):
            cities = [c.strip() for c in request.GET['city'].split(',') if c.strip()]
            qs = qs.filter(city__in=cities)

        if request.GET.get('province'):
            provs = [p.strip().upper() for p in request.GET['province'].split(',') if p.strip()]
            qs = qs.filter(state_or_province__in=provs)

        if request.GET.get('postal_code'):
            codes = [c.strip().upper() for c in request.GET['postal_code'].split(',') if c.strip()]
            qs = qs.filter(postal_code__in=codes)

        # === PROPERTY TYPE ===
        if request.GET.get('property_type'):
            types = [t.strip() for t in request.GET['property_type'].split(',') if t.strip()]
            qs = qs.filter(property_sub_type__in=types)

        # === STATUS ===
        if request.GET.get('status'):
            qs = qs.filter(standard_status=request.GET['status'].strip())

        # === LEASE AMOUNT (commercial) ===
        if request.GET.get('has_lease') in ('true', '1'):
            qs = qs.filter(lease_amount__gt=0)

        # === MAP BOUNDING BOX ===
        if all(k in request.GET for k in ['lat_min', 'lat_max', 'lng_min', 'lng_max']):
            qs = qs.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(request.GET['lat_min']),
                lat_float__lte=float(request.GET['lat_max']),
                lng_float__gte=float(request.GET['lng_min']),
                lng_float__lte=float(request.GET['lng_max']),
            )

        # === SOLD IN LAST N DAYS ===
        if request.GET.get('sold_days'):
            days = int(request.GET['sold_days'])
            cutoff = timezone.now() - timedelta(days=days)
            qs = qs.filter(status_change_timestamp__gte=cutoff)

        # === MODIFIED SINCE ===
        if request.GET.get('modified_since'):
            qs = qs.filter(modification_timestamp__gte=request.GET['modified_since'])

        # === HAS PHOTOS ===
        if request.GET.get('has_photos') in ('true', '1'):
            qs = qs.filter(photos_count__gt=0)

        # === UNIVERSAL SEARCH (address, remarks, listing ID, etc.) ===
        if request.GET.get('search'):
            search_term = request.GET['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                q = qs.filter(search_q)
        if request.GET.get('keywords'):
            keywords = [k.strip().lower() for k in request.GET['keywords'].split(',') if k.strip()]
            if keywords:
                kw_q = Q()
                for kw in keywords:
                    kw_q |= Q(public_remarks__icontains=kw)
                qs = qs.filter(kw_q)

        # === ORDERING ===
        order_by = request.GET.get('orderby', '-modification_timestamp')
        qs = qs.order_by(order_by)

        # === PAGINATION ===
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        return Response({
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data
        })
class PropertyDetailView(APIView):
    """
    Fetches a single property from DDF® API by PropertyKey.
    Supports both path-style and function-style access.
    """

    def get(self, request, PropertyKey):

        property_keys = request.GET.getlist('PropertyKey')
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

class PropertyCompareDetailView(APIView):
    def get(self, request, *args, **kwargs):
        listing_keys = request.query_params.getlist('listing_key')
        if not listing_keys:
            return Response({"detail": "No listing_keys provided."}, status=status.HTTP_400_BAD_REQUEST)
        properties = Property.objects.filter(listing_key__in=listing_keys)
        if not properties.exists():
            return Response({"detail": "No properties found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = PropertyDetailSerializer(properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
        if params.get('search'):
            search_term = params['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                qs = q.filter(search_q)
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
    



class UploadPreConnListingsAPIView(APIView):
    """
    POST /api/upload-pre-conn/
    Upload CSV or Excel file with column: listing_id
    Then GET /api/upload-pre-conn/ with filters to see updated listings
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Read file
        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(BytesIO(file_obj.read()))
            elif file_obj.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(BytesIO(file_obj.read()))
            else:
                return Response({"error": "File must be CSV or Excel"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Invalid file format: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Extract listing_ids
        if 'listing_id' not in df.columns:
            return Response({"error": "Column 'listing_id' not found in file"}, status=status.HTTP_400_BAD_REQUEST)

        listing_ids = df['listing_id'].dropna().astype(str).tolist()
        if not listing_ids:
            return Response({"error": "No valid listing_ids found"}, status=status.HTTP_400_BAD_REQUEST)

        # Update properties
        updated_qs = Property.objects.filter(listing_id__in=listing_ids)
        updated_count = updated_qs.update(category_type=Property.PRE_CONN)

        # Return summary + first page
        return Response({
            "message": f"Successfully updated {updated_count} properties to PRE_CONN",
            "updated_count": updated_count,
            "total_found": len(listing_ids),
            "preview": PropertySerializer(updated_qs[:10], many=True).data
        }, status=status.HTTP_200_OK)


class PreConnPropertiesAPIView(APIView):
    """
    GET /api/pre-conn-properties/
    Returns all properties with category_type = PRE_CONN
    Supports ALL REALTOR.ca filters + limit/offset
    """

    def get(self, request):
        limit = min(int(request.query_params.get('limit', 6)), 100)
        offset = int(request.query_params.get('offset', 0))

        # Base: only PRE_CONN properties
        qs = Property.objects.filter(category_type=Property.PRE_CONN)

        # === ALL REALTOR.CA FILTERS ===
        params = request.query_params
        if params.get('search'):
            search_term = params['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                q = qs.filter(search_q)

        if params.get('price_min'):
            qs = qs.filter(list_price__gte=float(params['price_min']))
        if params.get('price_max'):
            qs = qs.filter(list_price__lte=float(params['price_max']))

        if params.get('bedrooms'):
            qs = qs.filter(bedrooms_total__gte=int(params['bedrooms']))
        if params.get('bathrooms'):
            qs = qs.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

        if params.get('property_type'):
            types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
            if types:
                qs = qs.filter(property_sub_type__in=types)

        if params.get('city'):
            cities = [c.strip() for c in params['city'].split(',') if c.strip()]
            if cities:
                qs = qs.filter(city__in=cities)
        if params.get('province'):
            provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
            if provinces:
                qs = qs.filter(state_or_province__in=provinces)

        if params.get('postal_code'):
            codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
            if codes:
                qs = qs.filter(postal_code__in=codes)

        # Map bounding box
        if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
            qs = qs.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(params['latitude_min']),
                lat_float__lte=float(params['latitude_max']),
                lng_float__gte=float(params['longitude_min']),
                lng_float__lte=float(params['longitude_max']),
            )

        if params.get('building_area_min'):
            qs = qs.filter(building_area_total__gte=float(params['building_area_min']))
        if params.get('lot_size_min'):
            qs = qs.filter(lot_size_area__gte=float(params['lot_size_min']))
        if params.get('year_built_min'):
            qs = qs.filter(year_built__gte=int(params['year_built_min']))

        if params.get('keywords'):
            keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(public_remarks__icontains=kw)
            qs = qs.filter(kw_q)

        if params.get('has_photos') in ('true', '1', 'True'):
            qs = qs.filter(photos_count__gt=0)

        if params.get('new_listings_days'):
            days = int(params['new_listings_days'])
            from django.utils import timezone
            from datetime import timedelta
            cutoff = timezone.now() - timedelta(days=days)
            qs = qs.filter(modification_timestamp__gte=cutoff)

        if params.get('standard_status'):
            qs = qs.filter(standard_status=params['standard_status'])

        # Order & paginate
        qs = qs.order_by('-modification_timestamp', '-list_price')
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        return Response({
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data
        })
    

class LeasePropertiesAPIView(APIView):
    """
    GET /api/lease-properties/

    Returns ONLY properties with lease_amount > 0
    (Commercial leases, income properties, businesses for lease, etc.)

    Supports ALL realtor.ca filters + limit/offset pagination
    """

    def get(self, request):
        limit = min(int(request.query_params.get('limit', 6)), 100)
        offset = int(request.query_params.get('offset', 0))

        # Base: only properties with actual lease amount
        qs = Property.objects.filter(
            lease_amount__gt=0
        ).exclude(
            lease_amount__isnull=True
        )

        # === ALL REALTOR.CA FILTERS ===
        params = request.query_params
        if params.get('search'):
            search_term = params['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                q = qs.filter(search_q)
        if params.get('price_min'):
            qs = qs.filter(list_price__gte=float(params['price_min']))
        if params.get('price_max'):
            qs = qs.filter(list_price__lte=float(params['price_max']))

        if params.get('lease_amount_min'):
            qs = qs.filter(lease_amount__gte=float(params['lease_amount_min']))
        if params.get('lease_amount_max'):
            qs = qs.filter(lease_amount__lte=float(params['lease_amount_max']))

        if params.get('bedrooms'):
            qs = qs.filter(bedrooms_total__gte=int(params['bedrooms']))
        if params.get('bathrooms'):
            qs = qs.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

        if params.get('property_type'):
            types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
            if types:
                qs = qs.filter(property_sub_type__in=types)

        if params.get('city'):
            cities = [c.strip() for c in params['city'].split(',') if c.strip()]
            if cities:
                qs = qs.filter(city__in=cities)
        if params.get('province'):
            provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
            if provinces:
                qs = qs.filter(state_or_province__in=provinces)

        if params.get('postal_code'):
            codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
            if codes:
                qs = qs.filter(postal_code__in=codes)

        # Map bounding box
        if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
            qs = qs.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(params['latitude_min']),
                lat_float__lte=float(params['latitude_max']),
                lng_float__gte=float(params['longitude_min']),
                lng_float__lte=float(params['longitude_max']),
            )

        if params.get('building_area_min'):
            qs = qs.filter(building_area_total__gte=float(params['building_area_min']))
        if params.get('lot_size_min'):
            qs = qs.filter(lot_size_area__gte=float(params['lot_size_min']))
        if params.get('year_built_min'):
            qs = qs.filter(year_built__gte=int(params['year_built_min']))

        if params.get('keywords'):
            keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(public_remarks__icontains=kw)
            qs = qs.filter(kw_q)

        if params.get('has_photos') in ('true', '1', 'True'):
            qs = qs.filter(photos_count__gt=0)

        if params.get('new_listings_days'):
            days = int(params['new_listings_days'])
            cutoff = timezone.now() - timedelta(days=days)
            qs = qs.filter(modification_timestamp__gte=cutoff)

        if params.get('standard_status'):
            qs = qs.filter(standard_status=params['standard_status'])

        # Final ordering
        qs = qs.order_by('-lease_amount', '-modification_timestamp')

        # Pagination
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        return Response({
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data
        })
    




# class SoldPropertiesAPIView(APIView):
#     """
#     GET /api/sold-properties/

#     Returns ONLY properties with StandardStatus = 'Sold'
#     (Recently sold homes, condos, commercial, land, etc.)

#     Supports ALL realtor.ca filters + limit/offset pagination
#     """

#     def get(self, request):
#         limit = min(int(request.query_params.get('limit', 24)), 100)
#         offset = int(request.query_params.get('offset', 0))

#         # Base: only SOLD properties
   
#         qs = Property.objects.filter(standard_status="Sold")

#         # === ALL REALTOR.CA FILTERS ===
#         params = request.query_params

#         # Price range (original list price or sold price — here we use list_price)
#         if params.get('price_min'):
#             qs = qs.filter(list_price__gte=float(params['price_min']))
#         if params.get('price_max'):
#             qs = qs.filter(list_price__lte=float(params['price_max']))

#         # Bedrooms / Bathrooms
#         if params.get('bedrooms'):
#             qs = qs.filter(bedrooms_total__gte=int(params['bedrooms']))
#         if params.get('bathrooms'):
#             qs = qs.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

#         # Property type
#         if params.get('property_type'):
#             types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
#             if types:
#                 qs = qs.filter(property_sub_type__in=types)

#         # Location
#         if params.get('city'):
#             cities = [c.strip() for c in params['city'].split(',') if c.strip()]
#             if cities:
#                 qs = qs.filter(city__in=cities)
#         if params.get('province'):
#             provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
#             if provinces:
#                 qs = qs.filter(state_or_province__in=provinces)
#         if params.get('postal_code'):
#             codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
#             if codes:
#                 qs = qs.filter(postal_code__in=codes)

#         # Map bounding box
#         if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
#             qs = qs.annotate(
#                 lat_float=Cast('latitude', FloatField()),
#                 lng_float=Cast('longitude', FloatField())
#             ).filter(
#                 lat_float__gte=float(params['latitude_min']),
#                 lat_float__lte=float(params['latitude_max']),
#                 lng_float__gte=float(params['longitude_min']),
#                 lng_float__lte=float(params['longitude_max']),
#             )

#         # Size & lot
#         if params.get('building_area_min'):
#             qs = qs.filter(building_area_total__gte=float(params['building_area_min']))
#         if params.get('lot_size_min'):
#             qs = qs.filter(lot_size_area__gte=float(params['lot_size_min']))
#         if params.get('year_built_min'):
#             qs = qs.filter(year_built__gte=int(params['year_built_min']))

#         # Keywords in remarks
#         if params.get('keywords'):
#             keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
#             kw_q = Q()
#             for kw in keywords:
#                 kw_q |= Q(public_remarks__icontains=kw)
#             qs = qs.filter(kw_q)

#         # Has photos
#         if params.get('has_photos') in ('true', '1', 'True'):
#             qs = qs.filter(photos_count__gt=0)

#         # Sold in last N days
#         if params.get('sold_days'):
#             days = int(params['sold_days'])
#             cutoff = timezone.now() - timedelta(days=days)
#             qs = qs.filter(status_change_timestamp__gte=cutoff)

#         # Final ordering: most recent sold first
#         qs = qs.order_by('-status_change_timestamp', '-list_price')

#         # Pagination
#         paginator = Paginator(qs, limit)
#         page = paginator.get_page((offset // limit) + 1)

#         serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

#         return Response({
#             "count": paginator.count,
#             "next": offset + limit if page.has_next() else None,
#             "previous": offset - limit if offset >= limit else None,
#             "results": serializer.data
#         })