import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from mls.models import Media, Property
from vlog.models import VlogPost

print("--- Media (Properties) ---")
media_with_files = Media.objects.exclude(media_file="").count()
media_total = Media.objects.count()
print(f"Total Media records: {media_total}")
print(f"Media with files (Cloudinary/Local): {media_with_files}")

if media_with_files > 0:
    sample = Media.objects.exclude(media_file="").first()
    print(f"Sample Media File URL: {sample.media_file.url if sample.media_file else 'None'}")
    print(f"Sample Media URL: {sample.media_url}")

print("\n--- Vlog (Blogs) ---")
vlogs_with_thumbnails = VlogPost.objects.exclude(thumbnail="").count()
vlogs_total = VlogPost.objects.count()
print(f"Total Vlog posts: {vlogs_total}")
print(f"Vlogs with thumbnails: {vlogs_with_thumbnails}")

if vlogs_with_thumbnails > 0:
    sample_vlog = VlogPost.objects.exclude(thumbnail="").first()
    print(f"Sample Vlog Thumbnail URL: {sample_vlog.thumbnail.url if sample_vlog.thumbnail else 'None'}")
