"""Seed homepage content so the sections have something to show on day one.

Idempotent: existing rows (matched by title / feed URL / city) are left
untouched, so edits made in admin survive a re-run. Program amounts are
starting points only — every seeded incentive must be checked against its
source in admin (and ``reviewed_at`` set) before launch.
"""

from django.core.management.base import BaseCommand

from homepage.models import BuyerIncentive, CommunityImage, NewsSource, Partner

# The HomeAtlasUI reference set (product decision: treat it as correct). No
# source links or review dates are seeded; add both in admin. Note the CMHC
# First-Time Home Buyer Incentive stopped taking applications in 2024 — it is
# seeded because the reference lists it, but should likely be deactivated.
INCENTIVES = [
    ("FIRST-TIME BUYER", "First-Time Buyer Rebate", "Up to $6,475",
     "Ontario and Toronto land transfer tax rebates for first-time buyers purchasing their primary residence.", "home"),
    ("TAX SAVINGS", "FHSA – Tax-Free Savings", "Up to $40,000",
     "The First Home Savings Account lets you save up to $8,000/year tax-free toward your first home.", "savings"),
    ("GREEN HOMES", "Green Home Incentives", "Up to $5,000",
     "Federal rebates for purchasing energy-efficient homes or upgrading to qualify for green certification.", "green"),
    ("NEW CONSTRUCTION", "GST/HST New Housing Rebate", "Up to $24,000",
     "Rebate for newly constructed or substantially renovated homes used as your primary residence.", "construction"),
    ("SHARED EQUITY", "Shared Equity Program", "5–10% Equity",
     "CMHC's First-Time Home Buyer Incentive provides shared equity mortgage to reduce monthly payments.", "equity"),
    ("RETIREMENT SAVINGS", "Home Buyers' Plan (RRSP)", "Up to $35,000",
     "Withdraw up to $35,000 from your RRSP tax-free to purchase or build your first qualifying home.", "retirement"),
]

NEWS_SOURCES = [
    ("Bank of Canada", "https://www.bankofcanada.ca/content_type/press-releases/feed/", "Mortgage Rates"),
    ("CMHC", "https://www.cmhc-schl.gc.ca/en/rss/media-newsroom", "Housing"),
]

COMMUNITY_IMAGES = [
    ("Toronto", "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=600&h=900&fit=crop&auto=format"),
    ("Mississauga", "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=900&fit=crop&auto=format"),
    ("Vaughan", "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=900&fit=crop&auto=format"),
    ("Markham", "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=600&h=900&fit=crop&auto=format"),
    ("Oakville", "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=900&fit=crop&auto=format"),
]


class Command(BaseCommand):
    help = "Seed buyer incentives, news sources and community images (idempotent)."

    def handle(self, *args, **options):
        created = {"incentives": 0, "news_sources": 0, "community_images": 0}
        for order, (label, title, amount, description, icon) in enumerate(INCENTIVES):
            _, made = BuyerIncentive.objects.get_or_create(
                title=title,
                defaults={
                    "label": label,
                    "amount_text": amount,
                    "description": description,
                    "icon": icon,
                    "display_order": order,
                },
            )
            created["incentives"] += int(made)
        for name, url, tag in NEWS_SOURCES:
            _, made = NewsSource.objects.get_or_create(feed_url=url, defaults={"name": name, "tag": tag})
            created["news_sources"] += int(made)
        for city, image in COMMUNITY_IMAGES:
            _, made = CommunityImage.objects.get_or_create(
                city_key=city.lower(),
                defaults={"city_label": city, "image_url": image, "credit": "Unsplash"},
            )
            created["community_images"] += int(made)
        self.stdout.write(self.style.SUCCESS(f"Seeded {created}. Verify incentive amounts in admin before launch."))
        if not Partner.objects.exists():
            self.stdout.write("No partners seeded: add real partner firms in admin (Homepage > Partners).")
