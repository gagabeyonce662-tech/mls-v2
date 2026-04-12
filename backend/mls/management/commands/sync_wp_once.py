import requests
from django.core.management.base import BaseCommand
from mls.models import Property
from django.db import transaction

class Command(BaseCommand):
    help = 'One-time sync of Pre-Construction properties from WordPress to local database'

    def handle(self, *args, **options):
        url = "https://estate-4u.com/wp-json/wp/v2/properties?per_page=100"
        self.stdout.write(f"Fetching data from {url}...")
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            wp_data = response.json()
        except Exception as e:
            self.stderr.write(f"Failed to fetch data: {e}")
            return

        self.stdout.write(f"Found {len(wp_data)} properties. Starting migration...")

        count = 0
        with transaction.atomic():
            for p in wp_data:
                # Extracting data similar to the frontend mapper
                meta = p.get('property_meta', {})
                def get_meta(key):
                    val = meta.get(key, [])
                    return val[0] if val else ""

                price = get_meta("fave_property_price")
                bedrooms = get_meta("fave_property_bedrooms")
                bathrooms = get_meta("fave_property_bathrooms")
                size = get_meta("fave_property_size")
                developer = get_meta("fave_developer")
                completion = get_meta("fave_estimated-completion")
                address = get_meta("fave_property_address") or p.get('title', {}).get('rendered', '')
                
                project_name = p.get('title', {}).get('rendered', '')
                content = p.get('content', {}).get('rendered', '').strip()
                
                # We use a unique key for WP properties to avoid collisions with MLS
                listing_key = f"wp_precon_{p['id']}"
                
                # Compose public remarks to include developer and completion since we don't have dedicated fields
                custom_remarks = f"Project: {project_name}\nDeveloper: {developer}\nEstimated Completion: {completion}\n\n{content}"

                defaults = {
                    "category_type": Property.PRE_CONN,
                    "street_name": project_name, # Storing project name in street_name
                    "unparsed_address": address,
                    "city": "Pre-Construction",
                    "standard_status": "Pre-Construction",
                    "list_price": float(price) if price and price.replace('.','').isdigit() else 0,
                    "bedrooms_total": int(bedrooms) if bedrooms and bedrooms.isdigit() else 0,
                    "bathrooms_total_integer": int(bathrooms) if bathrooms and bathrooms.isdigit() else 0,
                    "building_area_total": float(size) if size and size.replace('.','').isdigit() else 0,
                    "public_remarks": custom_remarks[:10000], # Django TextFields are large usually
                    "origin_system_name": f"WP_MIGRATION_{developer}", # Tagging for reference
                }

                obj, created = Property.objects.update_or_create(
                    listing_key=listing_key,
                    defaults=defaults
                )
                
                # Handle images if available
                # WP returns a lot of stuff, let's try to find the main image
                main_image = p.get('yoast_head_json', {}).get('og_image', [{}])[0].get('url', '')
                if main_image:
                    from mls.models import Media
                    Media.objects.update_or_create(
                        property=obj,
                        media_url=main_image,
                        defaults={'order': 1, 'is_preferred': True, 'media_category': 'Main Image'}
                    )

                count += 1
                if count % 10 == 0:
                    self.stdout.write(f"Migrated {count} properties...")

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {count} properties to the database!"))
