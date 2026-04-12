import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from vlog.models import VlogPost
from mls.models import Property

print(f"VlogPost count: {VlogPost.objects.count()}")
print(f"Pre-Construction Property count: {Property.objects.filter(city='Pre-Construction').count()}")

# Sample Blog
vlog = VlogPost.objects.first()
if vlog:
    print(f"Sample Vlog: {vlog.title} (Slug: {vlog.slug})")

# Sample Pre-con
precon = Property.objects.filter(city='Pre-Construction').first()
if precon:
    print(f"Sample Pre-con: {precon.street_name} (Listing Key: {precon.listing_key})")
