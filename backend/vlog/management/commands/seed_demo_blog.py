from datetime import datetime, timezone as datetime_timezone

from django.core.management.base import BaseCommand
from django.db import transaction

from vlog.models import VlogCategory, VlogPost


SAMPLE_POSTS = (
    {
        "category": "Buying Guides",
        "title": "Buying a Pre-Construction Home in Ontario: A Practical Checklist",
        "slug": "buying-a-pre-construction-home-in-ontario",
        "excerpt": "A buyer-friendly checklist for comparing a pre-construction project, understanding deposits, and preparing for closing day.",
        "content": """# Buying a Pre-Construction Home in Ontario

A pre-construction purchase can give you more time to plan, but it also follows a different timeline from a resale home.

## Before you reserve a home

- Compare the starting price, interior size, parking, and included finishes.
- Ask for the full deposit schedule and the dates each payment is due.
- Review builder incentives in writing; they can change by release and home type.
- Confirm which items are included in the purchase price and which are upgrades.

## Understand the timeline

Occupancy and closing dates may move. Your agreement should explain expected dates and notices. A real-estate lawyer can help you review the agreement during the rescission period.

## Plan for closing costs

Budget for more than the deposit. Closing costs can include legal fees, land transfer tax, development-related charges, utility connections, and adjustments.

Make a short list of projects that fit your budget and preferred location, then compare the details side by side before reserving.""",
        "tags": "pre-construction, Ontario real estate, buyer guide, deposits",
        "publish_date": "2026-07-20T14:00:00+00:00",
        "focus_keyword": "buying a pre-construction home in Ontario",
        "seo_description": "Use this practical checklist to compare a pre-construction home in Ontario, understand deposits, and prepare for closing costs.",
        "faq_items": [
            {"question": "Can I change my mind after signing?", "answer": "Ontario pre-construction purchases generally include a rescission period. Ask your lawyer to confirm how it applies to your agreement."},
            {"question": "Is the deposit due all at once?", "answer": "Often it is paid in installments. The exact dates and amounts are set out in the agreement of purchase and sale."},
        ],
    },
    {
        "category": "Market Insights",
        "title": "How to Compare Townhome Communities Before You Buy",
        "slug": "how-to-compare-townhome-communities",
        "excerpt": "Look beyond the model home: compare location, layout, monthly costs, amenities, and builder terms before choosing a townhome community.",
        "content": """# How to Compare Townhome Communities Before You Buy

Two townhome communities can have similar advertised prices and still offer very different day-to-day value. A structured comparison helps you look beyond the brochure.

## Start with the location

Map the routes you will actually use: commuting, schools, groceries, parks, and transit. Consider what is already open today and what is only planned for the future.

## Compare the home, not only the price

Ask for the floor plan and included-features list. Check interior square footage, usable storage, bedroom and bathroom count, parking, appliances, and finish allowances.

## Check the monthly picture

For freehold and condominium townhomes, ownership costs can be different. Ask about maintenance fees, utility responsibilities, and common-element obligations.

The same community may have different pricing, incentives, and deposit schedules across releases. Get the current information in writing before deciding.""",
        "tags": "townhomes, home buying, community comparison, Ontario",
        "publish_date": "2026-07-15T14:00:00+00:00",
        "focus_keyword": "compare townhome communities",
        "seo_description": "Learn how to compare townhome communities by location, layout, monthly costs, amenities, and current builder terms.",
        "faq_items": [],
    },
    {
        "category": "Selling Advice",
        "title": "Preparing Your Home for a Strong First Impression",
        "slug": "preparing-your-home-for-a-strong-first-impression",
        "excerpt": "A focused preparation plan for sellers: declutter, repair, clean, photograph, and make each room easy for buyers to understand.",
        "content": """# Preparing Your Home for a Strong First Impression

The goal of preparing a home for sale is to make it easy for buyers to picture their own life there.

## Focus on the first five minutes

Start with the approach to the home, entryway, kitchen, and primary living space. These areas shape a buyer's first impression and deserve the most attention.

## Use a practical preparation order

1. Complete small repairs that stand out in photos or showings.
2. Declutter surfaces and remove excess furniture.
3. Deep clean windows, floors, kitchens, and bathrooms.
4. Add simple lighting and fresh, neutral linens where useful.
5. Schedule professional photography once the home is ready.

Strong presentation attracts attention; accurate pricing helps turn that attention into qualified showings. Review recent comparable sales with your agent before the property goes live.""",
        "tags": "selling a home, home staging, listing preparation, sellers",
        "publish_date": "2026-07-10T14:00:00+00:00",
        "focus_keyword": "preparing your home for sale",
        "seo_description": "Prepare your home for sale with a practical plan for repairs, decluttering, cleaning, photography, and a strong first impression.",
        "faq_items": [],
    },
)


class Command(BaseCommand):
    help = "Create or update the sample published posts used by the public Blog page."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Preview without writing data.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        created = updated = 0

        with transaction.atomic():
            categories = {}
            for item in SAMPLE_POSTS:
                category_name = item["category"]
                category = categories.get(category_name)
                if category is None:
                    category, _ = VlogCategory.objects.get_or_create(name=category_name)
                    categories[category_name] = category

                existing = VlogPost.objects.filter(slug=item["slug"]).first()
                action = "update" if existing else "create"
                self.stdout.write(f"Would {action}: {item['title']}" if dry_run else f"{action.title()}: {item['title']}")
                if dry_run:
                    continue

                defaults = {
                    "title": item["title"],
                    "excerpt": item["excerpt"],
                    "content": item["content"].strip(),
                    "category": category,
                    "tags": item["tags"],
                    "status": VlogPost.PUBLISHED,
                    "publish_date": datetime.fromisoformat(item["publish_date"]).astimezone(datetime_timezone.utc),
                    "allow_comments": True,
                    "is_manual": True,
                    "seo_title": item["title"],
                    "seo_description": item["seo_description"],
                    "seo_keywords": item["tags"],
                    "focus_keyword": item["focus_keyword"],
                    "faq_items": item["faq_items"],
                }
                _, was_created = VlogPost.objects.update_or_create(slug=item["slug"], defaults=defaults)
                created += int(was_created)
                updated += int(not was_created)

            if dry_run:
                transaction.set_rollback(True)

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run complete; no posts were written."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Sample blog ready: {created} created, {updated} updated."))
