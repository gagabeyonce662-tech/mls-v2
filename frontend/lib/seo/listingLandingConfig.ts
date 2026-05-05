import type { ExclusivePropertyFilterParams } from "@/lib/api";

export interface ListingLandingFaq {
  question: string;
  answer: string;
}

export interface ListingLandingConfig {
  slug: string;
  label: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  heroEyebrow?: string;
  heroBody?: string;
  filters: ExclusivePropertyFilterParams;
  indexable: boolean;
  provisionalLogic?: boolean;
  canonicalPath?: string;
  faqs?: ListingLandingFaq[];
}

const LANDINGS: ListingLandingConfig[] = [
  {
    slug: "distress-sale-homes",
    label: "Distress Sale Homes",
    title: "Distress Sale Homes for Sale in GTA",
    description:
      "Browse distress sale homes across Toronto and the GTA. Explore urgent-sale opportunities with continuously refreshed MLS inventory.",
    h1: "Distress Sale Homes in GTA",
    intro:
      "Find properties where motivated sellers may be open to faster closings and competitive offers. Listings refresh from our MLS-backed feed.",
    heroEyebrow: "Special Opportunity Listings",
    heroBody:
      "This page uses MLS search signals to surface potential distress inventory. Availability changes frequently as new listings enter the market.",
    filters: {
      keywords: "distress,urgent,bankruptcy,foreclosure,power of sale,motivated seller",
      standard_status: "Active",
    },
    indexable: true,
    provisionalLogic: true,
    faqs: [
      {
        question: "How are distress sale listings identified?",
        answer:
          "In phase one, this page uses listing text signals and status filters. It is a best-effort approximation and may include or miss edge cases.",
      },
    ],
  },
  {
    slug: "power-of-sale-properties",
    label: "Power of Sale Properties",
    title: "Power of Sale Properties in Ontario",
    description:
      "Search Ontario power of sale homes with MLS-backed updates. Review properties by city, budget, and home type.",
    h1: "Ontario Power of Sale Properties",
    intro:
      "Discover properties that may be sold under power-of-sale proceedings and filter by city, property type, and price range.",
    heroEyebrow: "Ontario Buyer Focus",
    heroBody:
      "Power of sale listings can move quickly. Track opportunities from our dynamic feed and revisit often for newly surfaced inventory.",
    filters: {
      province: "ON",
      keywords: "power of sale,mortgage default,lender sale,bank sale,foreclosure",
      standard_status: "Active",
    },
    indexable: true,
    provisionalLogic: true,
  },
  {
    slug: "detached-homes-under-1m",
    label: "Detached Under $1M",
    title: "Detached Homes Under $1M in GTA",
    description:
      "Explore detached homes priced under $1M across the GTA. Updated listing cards with photos, beds, baths, and map-ready results.",
    h1: "Detached Homes Under $1M",
    intro:
      "Focused inventory for detached-home buyers targeting sub-$1M budgets in competitive GTA markets.",
    heroEyebrow: "Budget-Focused Search",
    filters: {
      property_type: "Detached",
      price_max: 1000000,
      standard_status: "Active",
    },
    indexable: true,
  },
  {
    slug: "condos-in-mississauga",
    label: "Mississauga Condos",
    title: "Condos for Sale in Mississauga",
    description:
      "Browse condo listings in Mississauga with up-to-date MLS data. Compare price ranges, layouts, and building options.",
    h1: "Condos in Mississauga",
    intro:
      "A focused condo search for Mississauga buyers, including high-rise and low-rise options across key neighborhoods.",
    filters: {
      city: "Mississauga",
      property_type: "Condo Apt",
      standard_status: "Active",
    },
    indexable: true,
  },
  {
    slug: "luxury-homes-toronto",
    label: "Toronto Luxury Homes",
    title: "Luxury Homes for Sale in Toronto",
    description:
      "Discover luxury homes in Toronto with premium finishes and prime locations. Filter by property style and high-end price range.",
    h1: "Luxury Homes in Toronto",
    intro:
      "Curated luxury inventory in Toronto for buyers targeting premium neighborhoods and upscale detached or estate-style properties.",
    filters: {
      city: "Toronto",
      price_min: 2000000,
      standard_status: "Active",
    },
    indexable: true,
  },
  {
    slug: "brampton-detached-homes",
    label: "Brampton Detached Homes",
    title: "Detached Homes for Sale in Brampton",
    description:
      "View detached homes for sale in Brampton with real-time MLS updates. Filter by beds, baths, and price to shortlist faster.",
    h1: "Brampton Detached Homes",
    intro:
      "Dedicated detached-home results for Brampton buyers looking for family-oriented neighborhoods and flexible price bands.",
    filters: {
      city: "Brampton",
      property_type: "Detached",
      standard_status: "Active",
    },
    indexable: true,
  },
];

const landingMap = new Map<string, ListingLandingConfig>(
  LANDINGS.map((entry) => [entry.slug, entry]),
);

export function getListingLandingBySlug(
  slug: string,
): ListingLandingConfig | undefined {
  return landingMap.get(slug);
}

export function getAllListingLandings(): ListingLandingConfig[] {
  return LANDINGS;
}

export function getIndexableListingLandings(): ListingLandingConfig[] {
  return LANDINGS.filter((entry) => entry.indexable);
}

export function validateListingLandingConfig(
  entries: ListingLandingConfig[],
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry.slug || !entry.slug.trim()) {
      issues.push("Missing slug");
    }
    if (seen.has(entry.slug)) {
      issues.push(`Duplicate slug: ${entry.slug}`);
    }
    seen.add(entry.slug);
    if (!entry.title.trim()) issues.push(`Missing title: ${entry.slug}`);
    if (!entry.description.trim()) issues.push(`Missing description: ${entry.slug}`);
    if (!entry.h1.trim()) issues.push(`Missing h1: ${entry.slug}`);
    if (!entry.intro.trim()) issues.push(`Missing intro: ${entry.slug}`);
  }
  return issues;
}
