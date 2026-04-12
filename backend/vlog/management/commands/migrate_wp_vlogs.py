import requests
from django.core.management.base import BaseCommand
from vlog.models import VlogPost, VlogCategory
from django.db import transaction
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'One-time migration of WordPress posts to internal Vlog system'

    def handle(self, *args, **options):
        url = "https://estate-4u.com/wp-json/wp/v2/posts?per_page=100"
        self.stdout.write(f"Fetching posts from {url}...")
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            wp_data = response.json()
        except Exception as e:
            self.stderr.write(f"Failed to fetch posts: {e}")
            return

        self.stdout.write(f"Found {len(wp_data)} posts. Starting migration...")

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
                excerpt = p.get('excerpt', {}).get('rendered', '').strip()
                # Clean HTML from excerpt
                import re
                clean_excerpt = re.sub('<[^<]+?>', '', excerpt)
                
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
                }

                # Note: We can't easily download the ImageField thumbnail in this script 
                # without extra logic, but we can store the URL in a separate field or 
                # just rely on the frontend to handle the thumbnail URL if we add a field.
                # For now, let's keep it simple.

                obj, created = VlogPost.objects.update_or_create(
                    slug=slug,
                    defaults=defaults
                )
                
                count += 1
                if count % 10 == 0:
                    self.stdout.write(f"Migrated {count} posts...")

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {count} vlog posts to the database!"))
