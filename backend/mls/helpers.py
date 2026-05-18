import requests
from django.conf import settings
from datetime import datetime, timedelta
import requests
import logging
from django.db import IntegrityError
from celery import shared_task

from mls.snapshot_utils import record_listing_first_seen, record_property_snapshot

logger = logging.getLogger(__name__)

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

        # Create the AccessToken instance
        from mls.models import AccessToken
        if access_token:
            token = AccessToken.objects.create(
                access_token=access_token,
                refresh_token=refresh_token,
                access_token_expires_at=access_token_expiry,  # Store as DateTime
                refresh_token_expires_at=refresh_token_expiry  # Store as DateTime
            )
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

def fetch_properties():
    from .models import Property, Room, Media
    access_token = get_access_token()

    if not access_token:
        logger.error("Failed to authenticate")
        return
    
    url = 'https://ddfapi.realtor.ca/odata/v1/Property'
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {
        '$top': 100,
        '$orderby': 'ModificationTimestamp'
    }
    properties = []
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            properties.extend(data.get('value', []))
            logger.info(f"Fetched {len(properties)} properties from the first page.")
            next_page=False
            if data['@odata.nextLink']:
                next_page=True
            while next_page:
                print(len(properties))
                next_url = data['@odata.nextLink']
                response = requests.get(next_url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    properties.extend(data.get('value', []))
                    logger.info(f"Fetched {len(properties)} properties after following nextLink.")
                else:
                    logger.error(f"Failed to fetch next page: {response.status_code}")
                    break
            for property_data in properties:
                try:
                    property_instance, created = Property.objects.update_or_create(
                        listing_key=property_data.get('ListingKey'),
                        defaults={
                            'list_price': property_data.get('ListPrice'),
                            'property_sub_type': property_data.get('PropertySubType'),
                            'documents_available': ', '.join(property_data.get('DocumentsAvailable', [])),
                            'lease_amount': property_data.get('LeaseAmount'),
                            'lease_amount_frequency': property_data.get('LeaseAmountFrequency'),
                            'business_type': ', '.join(property_data.get('BusinessType', [])),
                            'lease_per_unit': property_data.get('LeasePerUnit'),
                            'price_per_unit': property_data.get('PricePerUnit'),
                            'water_body_name': property_data.get('WaterBodyName'),
                            'view': ', '.join(property_data.get('View', [])),
                            'number_of_buildings': property_data.get('NumberOfBuildings'),
                            'number_of_units_total': property_data.get('NumberOfUnitsTotal'),
                            'lot_features': ', '.join(property_data.get('LotFeatures', [])),
                            'lot_size_area': property_data.get('LotSizeArea'),
                            'lot_size_dimensions': property_data.get('LotSizeDimensions'),
                            'lot_size_units': property_data.get('LotSizeUnits'),
                            'pool_features': ', '.join(property_data.get('PoolFeatures', [])),
                            'road_surface_type': ', '.join(property_data.get('RoadSurfaceType', [])),
                            'current_use': ', '.join(property_data.get('CurrentUse', [])),
                            'possible_use': ', '.join(property_data.get('PossibleUse', [])),
                            'anchors_co_tenants': property_data.get('AnchorsCoTenants'),
                            'waterfront_features': ', '.join(property_data.get('WaterfrontFeatures', [])),
                            'community_features': ', '.join(property_data.get('CommunityFeatures', [])),
                            'frontage_length_numeric': property_data.get('FrontageLengthNumeric'),
                            'frontage_length_numeric_units': property_data.get('FrontageLengthNumericUnits'),
                            'fencing': ', '.join(property_data.get('Fencing', [])),
                            'appliances': ', '.join(property_data.get('Appliances', [])),
                            'other_equipment': ', '.join(property_data.get('OtherEquipment', [])),
                            'security_features': ', '.join(property_data.get('SecurityFeatures', [])),
                            'total_actual_rent': property_data.get('TotalActualRent'),
                            'existing_lease_type': ', '.join(property_data.get('ExistingLeaseType', [])),
                            'association_fee': property_data.get('AssociationFee'),
                            'association_fee_frequency': property_data.get('AssociationFeeFrequency'),
                            'association_name': property_data.get('AssociationName'),
                            'association_fee_includes': ', '.join(property_data.get('AssociationFeeIncludes', [])),
                            'original_entry_timestamp': property_data.get('OriginalEntryTimestamp'),
                            'modification_timestamp': property_data.get('ModificationTimestamp'),
                            'availability_date': property_data.get('AvailabilityDate'),
                            'listing_id': property_data.get('ListingId'),
                            'internet_entire_listing_display_yn': property_data.get('InternetEntireListingDisplayYN', False),
                            'internet_address_display_yn': property_data.get('InternetAddressDisplayYN', False),
                            'standard_status': property_data.get('StandardStatus'),
                            'status_change_timestamp': property_data.get('StatusChangeTimestamp'),
                            'public_remarks': property_data.get('PublicRemarks'),
                            'listing_url': property_data.get('ListingURL'),
                            'origin_system_name': property_data.get('OriginatingSystemName'),
                            'photos_count': property_data.get('PhotosCount'),
                            'photos_change_timestamp': property_data.get('PhotosChangeTimestamp'),
                            'common_interest': property_data.get('CommonInterest'),
                            'list_aor': property_data.get('ListAOR'),
                            # 'list_aor_key': property_data.get('ListAORKey'),
                            'unparsed_address': property_data.get('UnparsedAddress'),
                            'postal_code': property_data.get('PostalCode'),
                            'subdivision_name': property_data.get('SubdivisionName'),
                            'state_or_province': property_data.get('StateOrProvince'),
                            'street_dir_prefix': property_data.get('StreetDirPrefix'),
                            'street_dir_suffix': property_data.get('StreetDirSuffix'),
                            'street_name': property_data.get('StreetName'),
                            'street_number': property_data.get('StreetNumber'),
                            'street_suffix': property_data.get('StreetSuffix'),
                            'unit_number': property_data.get('UnitNumber'),
                            'country': property_data.get('Country'),
                            'city': property_data.get('City'),
                            'directions': property_data.get('Directions'),
                            'latitude': property_data.get('Latitude'),
                            'longitude': property_data.get('Longitude'),
                            'city_region': property_data.get('CityRegion'),
                            'map_coordinate_verified_yn': property_data.get('MapCoordinateVerifiedYN', False),
                            'geocode_manual_yn': property_data.get('GeocodeManualYN', False),
                            'parking_total': property_data.get('ParkingTotal'),
                            'year_built': property_data.get('YearBuilt'),
                            'bathrooms_partial': property_data.get('BathroomsPartial'),
                            'bathrooms_total_integer': property_data.get('BathroomsTotalInteger'),
                            'bedrooms_total': property_data.get('BedroomsTotal'),
                            'building_area_total': property_data.get('BuildingAreaTotal'),
                            'building_area_units': property_data.get('BuildingAreaUnits'),
                            'building_features': ', '.join(property_data.get('BuildingFeatures', [])),
                            'above_grade_finished_area': property_data.get('AboveGradeFinishedArea'),
                            'above_grade_finished_area_units': property_data.get('AboveGradeFinishedAreaUnits'),
                            'above_grade_finished_area_source': property_data.get('AboveGradeFinishedAreaSource'),
                            'below_grade_finished_area': property_data.get('BelowGradeFinishedArea'),
                            'below_grade_finished_area_units': property_data.get('BelowGradeFinishedAreaUnits'),
                            'below_grade_finished_area_source': property_data.get('BelowGradeFinishedAreaSource'),
                            'living_area': property_data.get('LivingArea'),
                            'living_area_units': property_data.get('LivingAreaUnits'),
                            'living_area_source': property_data.get('LivingAreaSource'),
                            'fireplaces_total': property_data.get('FireplacesTotal'),
                            'fireplace_yn': property_data.get('FireplaceYN'),
                            'fireplace_features': ', '.join(property_data.get('FireplaceFeatures', [])),
                            'architectural_style': ', '.join(property_data.get('ArchitecturalStyle', [])),
                            'heating': ', '.join(property_data.get('Heating', [])),
                            'foundation_details': ', '.join(property_data.get('FoundationDetails', [])),
                            'basement': ', '.join(property_data.get('Basement', [])),
                            'exterior_features': ', '.join(property_data.get('ExteriorFeatures', [])),
                            'flooring': ', '.join(property_data.get('Flooring', [])),
                            'parking_features': ', '.join(property_data.get('ParkingFeatures', [])),
                            'cooling': ', '.join(property_data.get('Cooling', [])),
                            'property_condition': ', '.join(property_data.get('PropertyCondition', [])),
                            'roof': ', '.join(property_data.get('Roof', [])),
                            'construction_materials': ', '.join(property_data.get('ConstructionMaterials', [])),
                            'stories': property_data.get('Stories'),
                            'property_attached_yn': property_data.get('PropertyAttachedYN', False),
                            'accessibility_features': ', '.join(property_data.get('AccessibilityFeatures', [])),
                            'bedrooms_above_grade': property_data.get('BedroomsAboveGrade'),
                            'bedrooms_below_grade': property_data.get('BedroomsBelowGrade'),
                            'zoning': property_data.get('Zoning'),
                            'zoning_description': property_data.get('ZoningDescription'),
                            'tax_annual_amount': property_data.get('TaxAnnualAmount'),
                            'tax_block': property_data.get('TaxBlock'),
                            'tax_lot': property_data.get('TaxLot'),
                            'tax_year': property_data.get('TaxYear'),
                            'structure_type': ', '.join(property_data.get('StructureType', [])),
                            'parcel_number': property_data.get('ParcelNumber'),
                            'utilities': ', '.join(property_data.get('Utilities', [])),
                            'irrigation_source': ', '.join(property_data.get('IrrigationSource', [])),
                            'water_source': ', '.join(property_data.get('WaterSource', [])),
                            'sewer': ', '.join(property_data.get('Sewer', [])),
                            'electric': ', '.join(property_data.get('Electric', [])),
                        }
                    )
                    if created:
                        logger.info(f"Created new property: {property_instance.listing_key}")
                    else:
                        logger.info(f"Updated existing property: {property_instance.listing_key}")

                    # Save Rooms
                    for room_data in property_data.get('Rooms', []):
                        Room.objects.update_or_create(
                            property=property_instance,
                            room_type=room_data.get('RoomType'),
                            defaults={
                                'room_length': room_data.get('RoomLength'),
                                'room_width': room_data.get('RoomWidth'),
                                'room_level': room_data.get('RoomLevel'),
                            }
                        )

                    # Save Media
                    for media_data in property_data.get('Media', []):
                        Media.objects.update_or_create(
                            property=property_instance,
                            media_url=media_data.get('MediaURL'),
                            defaults={
                                'media_category': media_data.get('MediaCategory'),
                                'is_preferred': media_data.get('PreferredPhotoYN'),
                                'order': media_data.get('Order'),
                            }
                        )

                    record_property_snapshot(property_instance)
                    record_listing_first_seen(
                        property_instance.listing_key,
                        property_instance.modification_timestamp,
                    )

                except IntegrityError as e:
                    logger.error(f"IntegrityError while processing property {property_data.get('ListingKey')}: {e}")
                except Exception as e:
                    logger.error(f"Error while processing property {property_data.get('ListingKey')}: {e}")

            logger.info(f"Total Properties Processed: {len(properties)}")
        else:
            logger.error(f"Failed to fetch data: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e: 
        logger.error(f"Request failed: {str(e)}")

@shared_task
def fetch_properties_by_property_data(property_data):
    print(property_data)
    from .models import Property, Room, Media
    property_instance, created = Property.objects.update_or_create(
    listing_key=property_data.get('ListingKey'),
    defaults={
        'list_price': property_data.get('ListPrice'),
        'property_sub_type': property_data.get('PropertySubType'),
        'documents_available': ', '.join(property_data.get('DocumentsAvailable', [])),
        'lease_amount': property_data.get('LeaseAmount'),
        'lease_amount_frequency': property_data.get('LeaseAmountFrequency'),
        'business_type': ', '.join(property_data.get('BusinessType', [])),
        'lease_per_unit': property_data.get('LeasePerUnit'),
        'price_per_unit': property_data.get('PricePerUnit'),
        'water_body_name': property_data.get('WaterBodyName'),
        'view': ', '.join(property_data.get('View', [])),
        'number_of_buildings': property_data.get('NumberOfBuildings'),
        'number_of_units_total': property_data.get('NumberOfUnitsTotal'),
        'lot_features': ', '.join(property_data.get('LotFeatures', [])),
        'lot_size_area': property_data.get('LotSizeArea'),
        'lot_size_dimensions': property_data.get('LotSizeDimensions'),
        'lot_size_units': property_data.get('LotSizeUnits'),
        'pool_features': ', '.join(property_data.get('PoolFeatures', [])),
        'road_surface_type': ', '.join(property_data.get('RoadSurfaceType', [])),
        'current_use': ', '.join(property_data.get('CurrentUse', [])),
        'possible_use': ', '.join(property_data.get('PossibleUse', [])),
        'anchors_co_tenants': property_data.get('AnchorsCoTenants'),
        'waterfront_features': ', '.join(property_data.get('WaterfrontFeatures', [])),
        'community_features': ', '.join(property_data.get('CommunityFeatures', [])),
        'frontage_length_numeric': property_data.get('FrontageLengthNumeric'),
        'frontage_length_numeric_units': property_data.get('FrontageLengthNumericUnits'),
        'fencing': ', '.join(property_data.get('Fencing', [])),
        'appliances': ', '.join(property_data.get('Appliances', [])),
        'other_equipment': ', '.join(property_data.get('OtherEquipment', [])),
        'security_features': ', '.join(property_data.get('SecurityFeatures', [])),
        'total_actual_rent': property_data.get('TotalActualRent'),
        'existing_lease_type': ', '.join(property_data.get('ExistingLeaseType', [])),
        'association_fee': property_data.get('AssociationFee'),
        'association_fee_frequency': property_data.get('AssociationFeeFrequency'),
        'association_name': property_data.get('AssociationName'),
        'association_fee_includes': ', '.join(property_data.get('AssociationFeeIncludes', [])),
        'original_entry_timestamp': property_data.get('OriginalEntryTimestamp'),
        'modification_timestamp': property_data.get('ModificationTimestamp'),
        'availability_date': property_data.get('AvailabilityDate'),
        'listing_id': property_data.get('ListingId'),
        'internet_entire_listing_display_yn': property_data.get('InternetEntireListingDisplayYN', False),
        'internet_address_display_yn': property_data.get('InternetAddressDisplayYN', False),
        'standard_status': property_data.get('StandardStatus'),
        'status_change_timestamp': property_data.get('StatusChangeTimestamp'),
        'public_remarks': property_data.get('PublicRemarks'),
        'listing_url': property_data.get('ListingURL'),
        'origin_system_name': property_data.get('OriginatingSystemName'),
        'photos_count': property_data.get('PhotosCount'),
        'photos_change_timestamp': property_data.get('PhotosChangeTimestamp'),
        'common_interest': property_data.get('CommonInterest'),
        'list_aor': property_data.get('ListAOR'),
        'unparsed_address': property_data.get('UnparsedAddress'),
        'postal_code': property_data.get('PostalCode'),
        'subdivision_name': property_data.get('SubdivisionName'),
        'state_or_province': property_data.get('StateOrProvince'),
        'street_dir_prefix': property_data.get('StreetDirPrefix'),
        'street_dir_suffix': property_data.get('StreetDirSuffix'),
        'street_name': property_data.get('StreetName'),
        'street_number': property_data.get('StreetNumber'),
        'street_suffix': property_data.get('StreetSuffix'),
        'unit_number': property_data.get('UnitNumber'),
        'country': property_data.get('Country'),
        'city': property_data.get('City'),
        'directions': property_data.get('Directions'),
        'latitude': property_data.get('Latitude'),
        'longitude': property_data.get('Longitude'),
        'city_region': property_data.get('CityRegion'),
        'map_coordinate_verified_yn': property_data.get('MapCoordinateVerifiedYN', False),
        'geocode_manual_yn': property_data.get('GeocodeManualYN', False),
        'parking_total': property_data.get('ParkingTotal'),
        'year_built': property_data.get('YearBuilt'),
        'bathrooms_partial': property_data.get('BathroomsPartial'),
        'bathrooms_total_integer': property_data.get('BathroomsTotalInteger'),
        'bedrooms_total': property_data.get('BedroomsTotal'),
        'building_area_total': property_data.get('BuildingAreaTotal'),
        'building_area_units': property_data.get('BuildingAreaUnits'),
        'building_features': ', '.join(property_data.get('BuildingFeatures', [])),
        'above_grade_finished_area': property_data.get('AboveGradeFinishedArea'),
        'above_grade_finished_area_units': property_data.get('AboveGradeFinishedAreaUnits'),
        'above_grade_finished_area_source': property_data.get('AboveGradeFinishedAreaSource'),
        'below_grade_finished_area': property_data.get('BelowGradeFinishedArea'),
        'below_grade_finished_area_units': property_data.get('BelowGradeFinishedAreaUnits'),
        'below_grade_finished_area_source': property_data.get('BelowGradeFinishedAreaSource'),
        'living_area': property_data.get('LivingArea'),
        'living_area_units': property_data.get('LivingAreaUnits'),
        'living_area_source': property_data.get('LivingAreaSource'),
        'fireplaces_total': property_data.get('FireplacesTotal'),
        'fireplace_yn': property_data.get('FireplaceYN'),
        'fireplace_features': ', '.join(property_data.get('FireplaceFeatures', [])),
        'architectural_style': ', '.join(property_data.get('ArchitecturalStyle', [])),
        'heating': ', '.join(property_data.get('Heating', [])),
        'foundation_details': ', '.join(property_data.get('FoundationDetails', [])),
        'basement': ', '.join(property_data.get('Basement', [])),
        'exterior_features': ', '.join(property_data.get('ExteriorFeatures', [])),
        'flooring': ', '.join(property_data.get('Flooring', [])),
        'parking_features': ', '.join(property_data.get('ParkingFeatures', [])),
        'cooling': ', '.join(property_data.get('Cooling', [])),
        'property_condition': ', '.join(property_data.get('PropertyCondition', [])),
        'roof': ', '.join(property_data.get('Roof', [])),
        'construction_materials': ', '.join(property_data.get('ConstructionMaterials', [])),
        'stories': property_data.get('Stories'),
        'property_attached_yn': property_data.get('PropertyAttachedYN', False),
        'accessibility_features': ', '.join(property_data.get('AccessibilityFeatures', [])),
        'bedrooms_above_grade': property_data.get('BedroomsAboveGrade'),
        'bedrooms_below_grade': property_data.get('BedroomsBelowGrade'),
        'zoning': property_data.get('Zoning'),
        'zoning_description': property_data.get('ZoningDescription'),
        'tax_annual_amount': property_data.get('TaxAnnualAmount'),
        'tax_block': property_data.get('TaxBlock'),
        'tax_lot': property_data.get('TaxLot'),
        'tax_year': property_data.get('TaxYear'),
        'structure_type': ', '.join(property_data.get('StructureType', [])),
        'parcel_number': property_data.get('ParcelNumber'),
        'utilities': ', '.join(property_data.get('Utilities', [])),
        'irrigation_source': ', '.join(property_data.get('IrrigationSource', [])),
        'water_source': ', '.join(property_data.get('WaterSource', [])),
        'sewer': ', '.join(property_data.get('Sewer', [])),
        'electric': ', '.join(property_data.get('Electric', [])),
        }
    )

    logger.info(f"Created or updated property: {property_instance.listing_key}")

    # Save Rooms
    for room_data in property_data.get('Rooms', []):
        Room.objects.update_or_create(
            property=property_instance,
            room_type=room_data.get('RoomType'),
            defaults={
                'room_length': room_data.get('RoomLength'),
                'room_width': room_data.get('RoomWidth'),
                'room_level': room_data.get('RoomLevel'),
            }
        )

    # Save Media
    for media_data in property_data.get('Media', []):
        Media.objects.update_or_create(
            property=property_instance,
            media_url=media_data.get('MediaURL'),
            defaults={
                'media_category': media_data.get('MediaCategory'),
                'is_preferred': media_data.get('PreferredPhotoYN'),
                'order': media_data.get('Order'),
            }
        )
    record_property_snapshot(property_instance)
    record_listing_first_seen(
        property_instance.listing_key,
        property_instance.modification_timestamp,
    )
    logger.info(f"Processed property {property_instance.listing_key}")
