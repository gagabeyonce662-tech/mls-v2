import type { Metadata } from "next";
import PreConstructionPageClient from "@/components/preconstruction/PreConstructionPageClient";
import {
  fetchEstateProjects,
  getEstateProjectUrl,
} from "@/lib/api/estate";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8000:3000";
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
  const projects = await fetchEstateProjects();
  const itemList = projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${getEstateProjectUrl(project)}`,
      name: project.title,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: itemList,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PreConstructionPageClient initialProjects={projects} />
    </>
  );
}
