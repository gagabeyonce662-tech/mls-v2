from mls.models import Property
from mls.services.ddf.converters import (
    safe_bool,
    safe_datetime,
    safe_decimal,
    safe_int,
    safe_list,
    safe_str,
)


def map_property_defaults(data):
    """
    Convert one raw DDF property dictionary into values understood
    by the Django Property model.

    This function does not save anything to the database.
    """
    return {
        # Category
        "category_type": Property.DDF,

        # Core property information
        "list_price": safe_decimal(data.get("ListPrice")),
        "property_sub_type": safe_str(data.get("PropertySubType")),
        "documents_available": safe_list(data.get("DocumentsAvailable")),
        "lease_amount": safe_decimal(data.get("LeaseAmount")),
        "lease_amount_frequency": safe_str(
            data.get("LeaseAmountFrequency")
        ),
        "business_type": safe_list(data.get("BusinessType")),
        "lease_per_unit": safe_str(data.get("LeasePerUnit")),
        "price_per_unit": safe_str(data.get("PricePerUnit")),
        "water_body_name": safe_str(data.get("WaterBodyName")),
        "view": safe_list(data.get("View")),
        "number_of_buildings": safe_int(data.get("NumberOfBuildings")),
        "number_of_units_total": safe_int(
            data.get("NumberOfUnitsTotal")
        ),

        # Lot and exterior
        "lot_features": safe_list(data.get("LotFeatures")),
        "lot_size_area": safe_decimal(data.get("LotSizeArea")),
        "lot_size_dimensions": safe_str(data.get("LotSizeDimensions")),
        "lot_size_units": safe_str(data.get("LotSizeUnits")),
        "pool_features": safe_list(data.get("PoolFeatures")),
        "road_surface_type": safe_list(data.get("RoadSurfaceType")),
        "current_use": safe_list(data.get("CurrentUse")),
        "possible_use": safe_list(data.get("PossibleUse")),
        "anchors_co_tenants": safe_str(data.get("AnchorsCoTenants")),
        "waterfront_features": safe_list(
            data.get("WaterfrontFeatures")
        ),
        "community_features": safe_list(data.get("CommunityFeatures")),
        "frontage_length_numeric": safe_decimal(
            data.get("FrontageLengthNumeric")
        ),
        "frontage_length_numeric_units": safe_str(
            data.get("FrontageLengthNumericUnits")
        ),
        "fencing": safe_list(data.get("Fencing")),

        # Equipment and features
        "appliances": safe_list(data.get("Appliances")),
        "other_equipment": safe_list(data.get("OtherEquipment")),
        "security_features": safe_list(data.get("SecurityFeatures")),

        # Financial and association information
        "total_actual_rent": safe_decimal(data.get("TotalActualRent")),
        "existing_lease_type": safe_list(data.get("ExistingLeaseType")),
        "association_fee": safe_decimal(data.get("AssociationFee")),
        "association_fee_frequency": safe_str(
            data.get("AssociationFeeFrequency")
        ),
        "association_name": safe_str(data.get("AssociationName")),
        "association_fee_includes": safe_list(
            data.get("AssociationFeeIncludes")
        ),

        # Listing timestamps and status
        "original_entry_timestamp": safe_datetime(
            data.get("OriginalEntryTimestamp")
        ),
        "modification_timestamp": safe_datetime(
            data.get("ModificationTimestamp")
        ),
        "availability_date": safe_datetime(data.get("AvailabilityDate")),
        "listing_id": safe_str(data.get("ListingId")),
        "internet_entire_listing_display_yn": safe_bool(
            data.get("InternetEntireListingDisplayYN")
        ),
        "internet_address_display_yn": safe_bool(
            data.get("InternetAddressDisplayYN")
        ),
        "standard_status": safe_str(data.get("StandardStatus")),
        "status_change_timestamp": safe_datetime(
            data.get("StatusChangeTimestamp")
        ),
        "public_remarks": safe_str(data.get("PublicRemarks")),
        "listing_url": safe_str(data.get("ListingURL")),
        "origin_system_name": safe_str(data.get("OriginatingSystemName")),
        "photos_count": safe_int(data.get("PhotosCount")),
        "photos_change_timestamp": safe_datetime(
            data.get("PhotosChangeTimestamp")
        ),
        "common_interest": safe_str(data.get("CommonInterest")),
        "list_aor": safe_str(data.get("ListAOR")),

        # Address and location
        "unparsed_address": safe_str(data.get("UnparsedAddress")),
        "postal_code": safe_str(data.get("PostalCode")),
        "subdivision_name": safe_str(data.get("SubdivisionName")),
        "state_or_province": safe_str(data.get("StateOrProvince")),
        "street_dir_prefix": safe_str(data.get("StreetDirPrefix")),
        "street_dir_suffix": safe_str(data.get("StreetDirSuffix")),
        "street_name": safe_str(data.get("StreetName")),
        "street_number": safe_str(data.get("StreetNumber")),
        "street_suffix": safe_str(data.get("StreetSuffix")),
        "unit_number": safe_str(data.get("UnitNumber")),
        "country": safe_str(data.get("Country")),
        "city": safe_str(data.get("City")),
        "directions": safe_str(data.get("Directions")),
        "latitude": safe_decimal(data.get("Latitude")),
        "longitude": safe_decimal(data.get("Longitude")),
        "city_region": safe_str(data.get("CityRegion")),
        "map_coordinate_verified_yn": safe_bool(
            data.get("MapCoordinateVerifiedYN")
        ),
        "geocode_manual_yn": safe_bool(data.get("GeocodeManualYN")),

        # Building measurements
        "parking_total": safe_int(data.get("ParkingTotal")),
        "year_built": safe_int(data.get("YearBuilt")),
        "bathrooms_partial": safe_int(data.get("BathroomsPartial")),
        "bathrooms_total_integer": safe_int(
            data.get("BathroomsTotalInteger")
        ),
        "bedrooms_total": safe_int(data.get("BedroomsTotal")),
        "building_area_total": safe_decimal(
            data.get("BuildingAreaTotal")
        ),
        "building_area_units": safe_str(data.get("BuildingAreaUnits")),
        "building_features": safe_list(data.get("BuildingFeatures")),

        # Finished and living area
        "above_grade_finished_area": safe_decimal(
            data.get("AboveGradeFinishedArea")
        ),
        "above_grade_finished_area_units": safe_str(
            data.get("AboveGradeFinishedAreaUnits")
        ),
        "above_grade_finished_area_source": safe_str(
            data.get("AboveGradeFinishedAreaSource")
        ),
        "below_grade_finished_area": safe_decimal(
            data.get("BelowGradeFinishedArea")
        ),
        "below_grade_finished_area_units": safe_str(
            data.get("BelowGradeFinishedAreaUnits")
        ),
        "below_grade_finished_area_source": safe_str(
            data.get("BelowGradeFinishedAreaSource")
        ),
        "living_area": safe_decimal(data.get("LivingArea")),
        "living_area_units": safe_str(data.get("LivingAreaUnits")),
        "living_area_source": safe_str(data.get("LivingAreaSource")),

        # Interior and construction
        "fireplaces_total": safe_int(data.get("FireplacesTotal")),
        "fireplace_yn": safe_bool(data.get("FireplaceYN")),
        "fireplace_features": safe_list(data.get("FireplaceFeatures")),
        "architectural_style": safe_list(
            data.get("ArchitecturalStyle")
        ),
        "heating": safe_list(data.get("Heating")),
        "foundation_details": safe_list(data.get("FoundationDetails")),
        "basement": safe_list(data.get("Basement")),
        "exterior_features": safe_list(data.get("ExteriorFeatures")),
        "flooring": safe_list(data.get("Flooring")),
        "parking_features": safe_list(data.get("ParkingFeatures")),
        "cooling": safe_list(data.get("Cooling")),
        "property_condition": safe_list(data.get("PropertyCondition")),
        "roof": safe_list(data.get("Roof")),
        "construction_materials": safe_list(
            data.get("ConstructionMaterials")
        ),
        "stories": safe_int(data.get("Stories")),
        "property_attached_yn": safe_bool(data.get("PropertyAttachedYN")),
        "accessibility_features": safe_list(
            data.get("AccessibilityFeatures")
        ),
        "bedrooms_above_grade": safe_int(
            data.get("BedroomsAboveGrade")
        ),
        "bedrooms_below_grade": safe_int(
            data.get("BedroomsBelowGrade")
        ),

        # Zoning and taxes
        "zoning": safe_str(data.get("Zoning")),
        "zoning_description": safe_str(data.get("ZoningDescription")),
        "tax_annual_amount": safe_decimal(data.get("TaxAnnualAmount")),
        "tax_block": safe_str(data.get("TaxBlock")),
        "tax_lot": safe_str(data.get("TaxLot")),
        "tax_year": safe_int(data.get("TaxYear")),

        # Structure and utilities
        "structure_type": safe_list(data.get("StructureType")),
        "parcel_number": safe_str(data.get("ParcelNumber")),
        "utilities": safe_list(data.get("Utilities")),
        "irrigation_source": safe_list(data.get("IrrigationSource")),
        "water_source": safe_list(data.get("WaterSource")),
        "sewer": safe_list(data.get("Sewer")),
        "electric": safe_list(data.get("Electric")),
    }