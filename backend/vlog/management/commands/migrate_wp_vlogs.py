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
        # Look for the file in the frontend/data directory relative to the project root
        cmds_dir = os.path.dirname(os.path.abspath(__file__))
        mgmt_dir = os.path.dirname(cmds_dir)
        app_dir = os.path.dirname(mgmt_dir)
        backend_dir = os.path.dirname(app_dir)
        project_root = os.path.dirname(backend_dir)
        
        json_path = os.path.join(project_root, 'frontend', 'data', 'wp-posts.json')
        
        if not os.path.exists(json_path):
            self.stderr.write(f"JSON file not found at {json_path}")
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
                    # Since we are using ImageField, we can't easily download here, 
                    # but we can save the URL in the thumbnail field for now if the field allows it 
                    # (it doesn't, it's an ImageField).
                    # Actually, we'll keep the thumbnail empty and let the site use fallback for now, 
                    # or update the model to use a CharField for external URLs.
                }

                obj, created = VlogPost.objects.update_or_create(
                    slug=slug,
                    defaults=defaults
                )
                
                count += 1
                if count % 10 == 0:
                    self.stdout.write(f"Migrated {count} posts...")

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {count} vlog posts from local JSON!"))
