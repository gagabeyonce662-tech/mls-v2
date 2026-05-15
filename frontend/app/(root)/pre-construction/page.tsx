import type { Metadata } from "next";
import PreConstructionPageClient from "@/components/preconstruction/PreConstructionPageClient";
import { fetchPreConnProperties } from "@/lib/api/properties";
export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const PAGE_URL = `${SITE_URL}/pre-construction`;
const PAGE_TITLE = "Pre-Construction Projects in GTA | Estate-4u";
const PAGE_DESCRIPTION =
  "Explore new pre-construction condos, townhomes, and builder projects across the GTA with pricing, locations, and project highlights.";
const FALLBACK_IMAGE =
  "https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    siteName: "Estate-4u",
    images: [
      { url: FALLBACK_IMAGE, width: 1200, height: 630, alt: "Estate-4u" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [FALLBACK_IMAGE],
  },
};

export default async function PreConstructionPage() {
  const response = await fetchPreConnProperties({ limit: 24 });
  const itemList = (response.results || [])
    .slice(0, 24)
    .map((p: any, idx: number) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${PAGE_URL}#${p.listing_key || p.ListingKey || `project-${idx + 1}`}`,
      name: p.project_name || p.address || "Pre-Construction Project",
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: response.count || itemList.length,
      itemListElement: itemList,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PreConstructionPageClient />
    </>
  );
}
