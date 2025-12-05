# # management/commands/sync_ddf_properties.py
# import time
# import logging
# import requests
# from concurrent.futures import ThreadPoolExecutor, as_completed
# from django.core.management.base import BaseCommand
# from django.db import transaction
# from mls.helpers import get_access_token
# from decimal import Decimal
# from datetime import datetime
# from datetime import datetime, timedelta
# import pytz

# from mls.models import Property, Room, Media  # Replace with your actual app name

# logger = logging.getLogger(__name__)

# # Helper: Safe converters
# def safe_decimal(val, default=None):
#     if val in (None, '', 'null'):
#         return default
#     try:
#         return Decimal(str(val))
#     except:
#         return default

# def safe_int(val, default=None):
#     if val in (None, '', 'null'):
#         return default
#     try:
#         return int(float(val)) if '.' in str(val) else int(val)
#     except:
#         return default

# def safe_float(val, default=None):
#     try:
#         return float(val) if val not in (None, '', 'null') else default
#     except:
#         return default

# def safe_str(val, default=''):
#     return str(val).strip() if val and str(val).strip() not in ('null', '') else default

# def safe_list(val):
#     if not val or val == 'null':
#         return ''
#     return ', '.join([str(x).strip() for x in val if x and str(x).strip()])

# def safe_bool(val):
#     if val is True or str(val).lower() in ('true', 'yes', '1', 'y'):
#         return True
#     if val is False or str(val).lower() in ('false', 'no', '0', 'n'):
#         return False
#     return None

# def safe_datetime(val):
#     if not val or val == 'null':
#         return None
#     try:
#         dt = datetime.fromisoformat(val.replace('Z', '+00:00'))
#         return dt.astimezone(pytz.UTC).replace(tzinfo=None)
#     except:
#         return None

# class Command(BaseCommand):
#     help = 'Ultra-fast full sync of REALTOR.ca DDF properties'

#     def add_arguments(self, parser):
#         parser.add_argument('--full', action='store_true', help='Force full sync (ignore incremental)')
#         parser.add_argument('--threads', type=int, default=10, help='Parallel download threads (max 15)')
#         parser.add_argument('--batch-size', type=int, default=5000, help='Properties per DB batch')

#     def handle(self, *args, **options):
#         start_time = time.time()
#         token =get_access_token()
#         if not token:
#             self.stderr.write("Failed to get access token")
#             return

#         headers = {'Authorization': f'Bearer {token}'}
#         page_urls = self.collect_all_page_urls(headers, force_full=options['full'])

#         self.stdout.write(f"Found {len(page_urls)} pages to download using {options['threads']} threads...")

#         all_properties = []
#         with ThreadPoolExecutor(max_workers=options['threads']) as executor:
#             futures = [executor.submit(self.fetch_page, url, headers) for url in page_urls]
#             for i, future in enumerate(as_completed(futures), 1):
#                 batch = future.result()
#                 all_properties.extend(batch)
#                 self.stdout.write(f"Downloaded page {i}/{len(page_urls)} → {len(batch)} listings (Total: {len(all_properties)})")
#                 time.sleep(0.05)  # Be gentle

#         if not all_properties:
#             self.stdout.write("No properties returned.")
#             return

#         self.stdout.write(f"Starting bulk upsert of {len(all_properties):,} properties...")
#         self.bulk_upsert(all_properties, batch_size=options['batch_size'])

#         elapsed = time.time() - start_time
#         self.stdout.write(self.style.SUCCESS(f"COMPLETED in {elapsed:.1f} seconds ({len(all_properties)/elapsed:.1f} props/sec)"))



#     # def collect_all_page_urls(self, headers, force_full=False):
#     #     base = "https://ddfapi.realtor.ca/odata/v1/Property"
#     #     params = {
#     #         "$top": 100,
#     #         "$orderby": "ModificationTimestamp desc",
#     #     }

#     #     if not force_full:
#     #         last = Property.objects.order_by('-modification_timestamp').first()
#     #         if last and last.modification_timestamp:
#     #             cutoff = (last.modification_timestamp - timedelta(minutes=10)).isoformat() + "Z"
#     #             params["$filter"] = f"ModificationTimestamp gt {cutoff}"

#     #     urls = []
#     #     url = base
#     #     while url:
#     #         resp = requests.get(url, headers=headers, params=params if url == base else None, timeout=30)
#     #         resp.raise_for_status()
#     #         data = resp.json()
#     #         urls.append(url if url == base else data.get('@odata.nextLink'))
#     #         url = data.get('@odata.nextLink')
#     #         params = None
#     #         time.sleep(0.1)
#     #     return urls
    


#     def collect_all_page_urls(self, headers, force_full=False):
#         base = "https://ddfapi.realtor.ca/odata/v1/Property"
#         params = {
#             "$top": 100,
#             "$orderby": "ModificationTimestamp desc",
#         }

#         # Optional: remove filter for full test, or keep it
#         # if not force_full:
#         #     last = Property.objects.order_by('-modification_timestamp').first()
#         #     if last and last.modification_timestamp:
#         #         cutoff = (last.modification_timestamp - timedelta(minutes=10)).isoformat() + "Z"
#         #         params["$filter"] = f"ModificationTimestamp gt {cutoff}"

#         urls = []
#         url = base
#         page_count = 0
#         max_pages = 25  # ←←← ONLY 5 PAGES FOR TESTING

#         while url and page_count < max_pages:
#             resp = requests.get(url, headers=headers, params=params if url == base else None, timeout=30)
#             resp.raise_for_status()
#             data = resp.json()

#             current_url = url if url == base else data.get('@odata.nextLink')
#             urls.append(current_url)
            
#             self.stdout.write(f"Collected page URL {page_count + 1}: {current_url}")

#             url = data.get('@odata.nextLink')
#             params = None
#             page_count += 1
#             time.sleep(0.2)  # Be nice to the API

#         self.stdout.write(self.style.WARNING(f"TEST MODE: Limited to {len(urls)} pages"))
#         return urls







#     def fetch_page(self, url, headers):
#         resp = requests.get(url, headers=headers, timeout=30)
#         resp.raise_for_status()
#         return resp.json().get("value", [])

#     @transaction.atomic
#     def bulk_upsert(self, properties_data, batch_size=5000):
#         # We'll process in batches to avoid memory explosion
#         for i in range(0, len(properties_data), batch_size):
#             batch = properties_data[i:i + batch_size]
#             self.process_batch(batch)
#             self.stdout.write(f"Processed batch {i//batch_size + 1}/{(len(properties_data)-1)//batch_size + 1}")

#     def process_batch(self, batch):
#         listing_keys = [p["ListingKey"] for p in batch if p.get("ListingKey")]
#         existing = Property.objects.in_bulk(field_name="listing_key")
#         existing_keys = set(existing.keys())

#         property_objs = []
#         room_objs = []
#         media_objs = []
#         properties_to_update = []

#         for data in batch:
#             key = data.get("ListingKey")
#             print(key)
#             if not key:
#                 continue

#             defaults = {
#                 # === Core Fields ===
#                 "list_price": safe_decimal(data.get("ListPrice")),
#                 "property_sub_type": safe_str(data.get("PropertySubType")),
#                 "documents_available": safe_list(data.get("DocumentsAvailable")),
#                 "lease_amount": safe_decimal(data.get("LeaseAmount")),
#                 "lease_amount_frequency": safe_str(data.get("LeaseAmountFrequency")),
#                 "business_type": safe_list(data.get("BusinessType")),
#                 "lease_per_unit": safe_str(data.get("LeasePerUnit")),
#                 "price_per_unit": safe_str(data.get("PricePerUnit")),
#                 "water_body_name": safe_str(data.get("WaterBodyName")),
#                 "view": safe_list(data.get("View")),
#                 "number_of_buildings": safe_int(data.get("NumberOfBuildings")),
#                 "number_of_units_total": safe_int(data.get("NumberOfUnitsTotal")),
#                 "lot_features": safe_list(data.get("LotFeatures")),
#                 "lot_size_area": safe_decimal(data.get("LotSizeArea")),
#                 "lot_size_dimensions": safe_str(data.get("LotSizeDimensions")),
#                 "lot_size_units": safe_str(data.get("LotSizeUnits")),
#                 "pool_features": safe_list(data.get("PoolFeatures")),
#                 "road_surface_type": safe_list(data.get("RoadSurfaceType")),
#                 "current_use": safe_list(data.get("CurrentUse")),
#                 "possible_use": safe_list(data.get("PossibleUse")),
#                 "anchors_co_tenants": safe_str(data.get("AnchorsCoTenants")),
#                 "waterfront_features": safe_list(data.get("WaterfrontFeatures")),
#                 "community_features": safe_list(data.get("CommunityFeatures")),
#                 "frontage_length_numeric": safe_decimal(data.get("FrontageLengthNumeric")),
#                 "frontage_length_numeric_units": safe_str(data.get("FrontageLengthNumericUnits")),
#                 "fencing": safe_list(data.get("Fencing")),
#                 "appliances": safe_list(data.get("Appliances")),
#                 "other_equipment": safe_list(data.get("OtherEquipment")),
#                 "security_features": safe_list(data.get("SecurityFeatures")),
#                 "total_actual_rent": safe_decimal(data.get("TotalActualRent")),
#                 "existing_lease_type": safe_list(data.get("ExistingLeaseType")),
#                 "association_fee": safe_decimal(data.get("AssociationFee")),
#                 "association_fee_frequency": safe_str(data.get("AssociationFeeFrequency")),
#                 "association_name": safe_str(data.get("AssociationName")),
#                 "association_fee_includes": safe_list(data.get("AssociationFeeIncludes")),
#                 "original_entry_timestamp": safe_datetime(data.get("OriginalEntryTimestamp")),
#                 "modification_timestamp": safe_datetime(data.get("ModificationTimestamp")),
#                 "availability_date": safe_datetime(data.get("AvailabilityDate")),
#                 "listing_id": safe_str(data.get("ListingId")),
#                 "internet_entire_listing_display_yn": safe_bool(data.get("InternetEntireListingDisplayYN")),
#                 "standard_status": safe_str(data.get("StandardStatus")),
#                 "status_change_timestamp": safe_datetime(data.get("StatusChangeTimestamp")),
#                 "public_remarks": safe_str(data.get("PublicRemarks")),
#                 "listing_url": safe_str(data.get("ListingURL")),
#                 "origin_system_name": safe_str(data.get("OriginatingSystemName")),
#                 "photos_count": safe_int(data.get("PhotosCount")),
#                 "photos_change_timestamp": safe_datetime(data.get("PhotosChangeTimestamp")),
#                 "common_interest": safe_str(data.get("CommonInterest")),
#                 "list_aor": safe_str(data.get("ListAOR")),
#                 "unparsed_address": safe_str(data.get("UnparsedAddress")),
#                 "postal_code": safe_str(data.get("PostalCode")),
#                 "subdivision_name": safe_str(data.get("SubdivisionName")),
#                 "state_or_province": safe_str(data.get("StateOrProvince")),
#                 "street_dir_prefix": safe_str(data.get("StreetDirPrefix")),
#                 "street_dir_suffix": safe_str(data.get("StreetDirSuffix")),
#                 "street_name": safe_str(data.get("StreetName")),
#                 "street_number": safe_str(data.get("StreetNumber")),
#                 "street_suffix": safe_str(data.get("StreetSuffix")),
#                 "unit_number": safe_str(data.get("UnitNumber")),
#                 "country": safe_str(data.get("Country")),
#                 "city": safe_str(data.get("City")),
#                 "directions": safe_str(data.get("Directions")),
#                 "latitude": safe_decimal(data.get("Latitude")),
#                 "longitude": safe_decimal(data.get("Longitude")),
#                 "city_region": safe_str(data.get("CityRegion")),
#                 "map_coordinate_verified_yn": safe_bool(data.get("MapCoordinateVerifiedYN")),
#                 "geocode_manual_yn": safe_bool(data.get("GeocodeManualYN")),
#                 "parking_total": safe_int(data.get("ParkingTotal")),
#                 "year_built": safe_int(data.get("YearBuilt")),
#                 "bathrooms_partial": safe_int(data.get("BathroomsPartial")),
#                 "bathrooms_total_integer": safe_int(data.get("BathroomsTotalInteger")),
#                 "bedrooms_total": safe_int(data.get("BedroomsTotal")),
#                 "building_area_total": safe_decimal(data.get("BuildingAreaTotal")),
#                 "building_area_units": safe_str(data.get("BuildingAreaUnits")),
#                 "building_features": safe_list(data.get("BuildingFeatures")),
#                 "above_grade_finished_area": safe_decimal(data.get("AboveGradeFinishedArea")),
#                 "above_grade_finished_area_units": safe_str(data.get("AboveGradeFinishedAreaUnits")),
#                 "above_grade_finished_area_source": safe_str(data.get("AboveGradeFinishedAreaSource")),
#                 "below_grade_finished_area": safe_decimal(data.get("BelowGradeFinishedArea")),
#                 "below_grade_finished_area_units": safe_str(data.get("BelowGradeFinishedAreaUnits")),
#                 "below_grade_finished_area_source": safe_str(data.get("BelowGradeFinishedAreaSource")),
#                 "living_area": safe_decimal(data.get("LivingArea")),
#                 "living_area_units": safe_str(data.get("LivingAreaUnits")),
#                 "living_area_source": safe_str(data.get("LivingAreaSource")),
#                 "fireplaces_total": safe_int(data.get("FireplacesTotal")),
#                 "fireplace_yn": safe_bool(data.get("FireplaceYN")),
#                 "fireplace_features": safe_list(data.get("FireplaceFeatures")),
#                 "architectural_style": safe_list(data.get("ArchitecturalStyle")),
#                 "heating": safe_list(data.get("Heating")),
#                 "foundation_details": safe_list(data.get("FoundationDetails")),
#                 "basement": safe_list(data.get("Basement")),
#                 "exterior_features": safe_list(data.get("ExteriorFeatures")),
#                 "flooring": safe_list(data.get("Flooring")),
#                 "parking_features": safe_list(data.get("ParkingFeatures")),
#                 "cooling": safe_list(data.get("Cooling")),
#                 "property_condition": safe_list(data.get("PropertyCondition")),
#                 "roof": safe_list(data.get("Roof")),
#                 "construction_materials": safe_list(data.get("ConstructionMaterials")),
#                 "stories": safe_int(data.get("Stories")),
#                 "property_attached_yn": safe_bool(data.get("PropertyAttachedYN")),
#                 "accessibility_features": safe_list(data.get("AccessibilityFeatures")),
#                 "bedrooms_above_grade": safe_int(data.get("BedroomsAboveGrade")),
#                 "bedrooms_below_grade": safe_int(data.get("BedroomsBelowGrade")),
#                 "zoning": safe_str(data.get("Zoning")),
#                 "zoning_description": safe_str(data.get("ZoningDescription")),
#                 "tax_annual_amount": safe_decimal(data.get("TaxAnnualAmount")),
#                 "tax_block": safe_str(data.get("TaxBlock")),
#                 "tax_lot": safe_str(data.get("TaxLot")),
#                 "tax_year": safe_int(data.get("TaxYear")),
#                 "structure_type": safe_list(data.get("StructureType")),
#                 "parcel_number": safe_str(data.get("ParcelNumber")),
#                 "utilities": safe_list(data.get("Utilities")),
#                 "irrigation_source": safe_list(data.get("IrrigationSource")),
#                 "water_source": safe_list(data.get("WaterSource")),
#                 "sewer": safe_list(data.get("Sewer")),
#                 "electric": safe_list(data.get("Electric")),
#             }

#             if key in existing:
#                 prop = existing[key]
#                 for field, value in defaults.items():
#                     setattr(prop, field, value)
#                 properties_to_update.append(prop)
#             else:
#                 prop = Property(listing_key=key, **defaults)
#                 property_objs.append(prop)

#             # === Rooms ===
#             for r in data.get("Rooms", []):
#                 room_objs.append(Room(
#                     property=prop,
#                     room_type=safe_str(r.get("RoomType")),
#                     room_length=safe_decimal(r.get("RoomLength")),
#                     room_width=safe_decimal(r.get("RoomWidth")),
#                     room_level=safe_str(r.get("RoomLevel")),
#                     room_description=safe_str(r.get("RoomDescription")),
#                     room_dimensions=safe_str(r.get("RoomDimensions")),
#                     room_length_width_units=safe_str(r.get("RoomLengthWidthUnits")),
#                 ))

#             # === Media ===
#             for m in data.get("Media", []):
#                 media_objs.append(Media(
#                     property=prop,
#                     media_url=safe_str(m.get("MediaURL")),
#                     media_category=safe_str(m.get("MediaCategory")),
#                     is_preferred=safe_bool(m.get("PreferredPhotoYN")),
#                     order=safe_int(m.get("Order"), 999),
#                 ))

#         # === Final DB Operations ===
#         if property_objs:
#             Property.objects.bulk_create(property_objs, ignore_conflicts=False)

#         if properties_to_update:
#             Property.objects.bulk_update(
#                 properties_to_update,
#                 fields=[f.name for f in Property._meta.fields if f.name != "id" and f.name != "listing_key"]
#             )

#         # Replace rooms & media (faster than upsert)
#         if property_objs or properties_to_update:
#             affected_prop_ids = [p.id for p in (property_objs + properties_to_update) if hasattr(p, 'id')]
#             if affected_prop_ids:
#                 Room.objects.filter(property_id__in=affected_prop_ids).delete()
#                 Media.objects.filter(property_id__in=affected_prop_ids).delete()

#                 if room_objs:
#                     Room.objects.bulk_create(room_objs, ignore_conflicts=True)
#                 if media_objs:
#                     Media.objects.bulk_create(media_objs, ignore_conflicts=True)



# # python manage.py sync_ddf_properties --threads 12 --batch-size 8000
# # python manage.py sync_ddf_properties --full --threads 15