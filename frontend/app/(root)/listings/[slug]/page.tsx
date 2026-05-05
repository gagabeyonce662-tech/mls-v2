import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingLandingTemplate from "@/components/seo/ListingLandingTemplate";
import {
  getAllListingLandings,
  getListingLandingBySlug,
} from "@/lib/seo/listingLandingConfig";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  return getAllListingLandings().map((landing) => ({ slug: landing.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const landing = getListingLandingBySlug(slug);
  if (!landing) {
    return {
      title: "Listing Page Not Found",
      robots: { index: false, follow: false },
    };
  }
  const canonicalPath = landing.canonicalPath || `/listings/${landing.slug}`;
  return {
    title: landing.title,
    description: landing.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: landing.title,
      description: landing.description,
      url: canonicalPath,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: landing.title,
      description: landing.description,
    },
    robots: landing.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function ListingLandingPage({ params }: Props) {
  const { slug } = await params;
  const landing = getListingLandingBySlug(slug);
  if (!landing) {
    notFound();
  }

  return <ListingLandingTemplate landing={landing} />;
}
