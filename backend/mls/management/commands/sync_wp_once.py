import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from mls.models import Property
from django.db import transaction

class Command(BaseCommand):
    help = 'Migration of Pre-Construction properties using local JSON file to bypass API blocks'

    def handle(self, *args, **options):
        # Robust path resolution: check multiple possible locations
        base_dir = settings.BASE_DIR
        repo_root = os.path.dirname(base_dir)
        filename = 'pre-con-properties.json'
        
        possible_paths = [
            os.path.join(repo_root, 'frontend', 'data', filename), # GitHub Actions (cd backend)
            os.path.join(base_dir, 'frontend', 'data', filename), # Local (likely wrong but safe)
            os.path.join(base_dir, '..', 'frontend', 'data', filename) # Another common local structure
        ]
        
        json_path = None
        for path in possible_paths:
            if os.path.exists(path):
                json_path = path
                break
        
        if not json_path:
            self.stderr.write(f"Pre-con JSON file not found. Searched: {possible_paths}")
            return

        self.stdout.write(f"Reading properties from {json_path}...")
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                wp_data = json.load(f)
        except Exception as e:
            self.stderr.write(f"Failed to read JSON: {e}")
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
                
                # Unique key for WP properties
                listing_key = f"wp_precon_{p['id']}"
                
                # Compose public remarks
                custom_remarks = f"Project: {project_name}\nDeveloper: {developer}\nEstimated Completion: {completion}\n\n{content}"

                defaults = {
                    "category_type": Property.PRE_CONN,
                    "street_name": project_name, 
                    "unparsed_address": address,
                    "city": "Pre-Construction",
                    "standard_status": "Pre-Construction",
                    "list_price": float(price) if price and price.replace('.','').isdigit() else 0,
                    "bedrooms_total": int(bedrooms) if bedrooms and bedrooms.isdigit() else 0,
                    "bathrooms_total_integer": int(bathrooms) if bathrooms and bathrooms.isdigit() else 0,
                    "building_area_total": float(size) if size and size.replace('.','').isdigit() else 0,
                    "public_remarks": custom_remarks[:10000], 
                    "origin_system_name": f"WP_MIGRATION_{developer}",
                    "is_manual": True,
                }

                # Check if property already exists and is marked as manual
                obj = Property.objects.filter(listing_key=listing_key).first()
                if obj and obj.is_manual:
                    # Check if it already has media files
                    if obj.media.filter(media_file__isnull=False).exclude(media_file="").exists():
                        self.stdout.write(f"Skipping manual property (already has media): {project_name}")
                        continue
                    else:
                        self.stdout.write(f"Processing manual property to fetch missing media: {project_name}")
                else:
                    obj, created = Property.objects.update_or_create(
                        listing_key=listing_key,
                        defaults=defaults
                    )
                
                # Handle main image
                main_image = p.get('yoast_head_json', {}).get('og_image', [{}])[0].get('url', '')
                if main_image:
                    from mls.models import Media
                    from django.core.files.base import ContentFile
                    import requests
                    from urllib.parse import urlparse

                    media_obj, m_created = Media.objects.get_or_create(
                        property=obj,
                        media_url=main_image,
                        defaults={'order': 1, 'is_preferred': True, 'media_category': 'Main Image'}
                    )

                    # NEW: Download image if it's new or file is missing
                    if m_created or not media_obj.media_file:
                        try:
                            response = requests.get(main_image, timeout=15)
                            if response.status_code == 200:
                                path = urlparse(main_image).path
                                ext = os.path.splitext(path)[1] or '.jpg'
                                fname = f"main_{p['id']}{ext}"
                                media_obj.media_file.save(fname, ContentFile(response.content), save=True)
                                self.stdout.write(f"  - Downloaded property image: {fname}")
                        except Exception as e:
                            self.stderr.write(f"  - Failed to download property image {main_image}: {e}")

                count += 1
                if count % 10 == 0:
                    self.stdout.write(f"Migrated {count} properties...")

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {count} properties from local JSON!"))
