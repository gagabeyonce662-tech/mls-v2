import json
import os
import re
from django.core.management.base import BaseCommand
from vlog.models import VlogPost, VlogCategory
from django.db import transaction
from django.conf import settings

class Command(BaseCommand):
    help = 'Migration of WordPress posts using local JSON file to bypass API blocks'

    def handle(self, *args, **options):
        # Robust path resolution: check multiple possible locations
        base_dir = settings.BASE_DIR
        repo_root = os.path.dirname(base_dir)
        filename = 'wp-posts.json'
        
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
            self.stderr.write(f"Vlog JSON file not found. Searched: {possible_paths}")
            return

        self.stdout.write(f"Reading posts from {json_path}...")
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                wp_data = json.load(f)
        except Exception as e:
            self.stderr.write(f"Failed to read JSON: {e}")
            return

        self.stdout.write(f"Found {len(wp_data)} posts in JSON. Starting migration...")

        count = 0
        with transaction.atomic():
            # Ensure a default category exists
            default_cat, _ = VlogCategory.objects.get_or_create(
                name="Real Estate",
                defaults={"slug": "real-estate"}
            )

            for p in wp_data:
                title = p.get('title', {}).get('rendered', '')
                slug = p.get('slug', '')
                content = p.get('content', {}).get('rendered', '')
                excerpt_data = p.get('excerpt', {}).get('rendered', '')
                
                # Clean HTML from excerpt
                clean_excerpt = re.sub('<[^<]+?>', '', excerpt_data).strip()
                
                # Extract thumbnail
                thumbnail_url = p.get('jetpack_featured_media_url') or \
                               p.get('yoast_head_json', {}).get('og_image', [{}])[0].get('url', '')
                
                # Check for video embed in content
                embed_url = ""
                video_match = re.search(r'(https?://(?:www\.)?(?:youtube\.com/embed/|vimeo\.com/)\S+)', content)
                if video_match:
                    embed_url = video_match.group(1)

                defaults = {
                    "title": title,
                    "content": content,
                    "excerpt": clean_excerpt[:500],
                    "status": "published" if p.get('status') == 'publish' else 'draft',
                    "publish_date": p.get('date'),
                    "allow_comments": p.get('comment_status') == 'open',
                    "category": default_cat,
                    "embed_url": embed_url,
                    "is_manual": True,
                    # Since we are using ImageField, we can't easily download here, 
                    # but we can save the URL in the thumbnail field for now if the field allows it 
                    # (it doesn't, it's an ImageField).
                    # Actually, we'll keep the thumbnail empty and let the site use fallback for now, 
                    # or update the model to use a CharField for external URLs.
                }

                # Check if property already exists and is marked as manual
                obj = VlogPost.objects.filter(slug=slug).first()
                if obj and obj.is_manual:
                    # If it has a thumbnail already, skip it completely
                    if obj.thumbnail:
                        self.stdout.write(f"Skipping manual post (already has thumbnail): {title}")
                        continue
                    else:
                        self.stdout.write(f"Processing manual post to fetch missing thumbnail: {title}")
                else:
                    obj, created = VlogPost.objects.update_or_create(
                        slug=slug,
                        defaults=defaults
                    )

                # NEW: Download thumbnail if it doesn't exist yet
                if thumbnail_url and not obj.thumbnail:
                    try:
                        import requests
                        from django.core.files.base import ContentFile
                        from urllib.parse import urlparse

                        response = requests.get(thumbnail_url, timeout=15)
                        if response.status_code == 200:
                            # Get extension from URL or default to .jpg
                            path = urlparse(thumbnail_url).path
                            ext = os.path.splitext(path)[1] or '.jpg'
                            fname = f"{slug}{ext}"
                            
                            obj.thumbnail.save(fname, ContentFile(response.content), save=True)
                            self.stdout.write(f"  - Downloaded thumbnail: {fname}")
                    except Exception as e:
                        self.stderr.write(f"  - Failed to download {thumbnail_url}: {e}")
                
                count += 1
                if count % 10 == 0:
                    self.stdout.write(f"Migrated {count} posts...")

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {count} vlog posts from local JSON!"))
