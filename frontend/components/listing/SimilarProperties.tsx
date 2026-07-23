import React from "react";
import Link from "next/link";
import { fetchRecommendationsForListing } from "@/lib/api";
import SimilarPropertiesClient from "@/components/listing/SimilarPropertiesClient";
import { ds } from "@/lib/design-system-utils";
import type { Property } from "@/lib/api";

interface SimilarPropertiesProps {
  property: Property;
  /** i18n section heading (next-intl Listing.similarProperties) */
  sectionTitle?: string;
}

export default async function SimilarProperties({
  property,
  sectionTitle,
}: SimilarPropertiesProps) {
  const recommendations = await fetchRecommendationsForListing(property, 4);
  const hasAny =
    recommendations.for_this_home.length > 0 ||
    recommendations.based_on_your_history.length > 0 ||
    recommendations.people_also_viewed.length > 0 ||
    recommendations.fallback.length > 0;

  const city = String(property.city || property.City || "").trim();
  const isRental = Boolean(property.lease_amount || property.total_actual_rent);
  const browseHref = city
    ? `/listing?city=${encodeURIComponent(city)}`
    : "/listing";

  if (!hasAny) {
    return (
      <section className="mt-20 border-t border-ds-card-border pt-16 text-center">
        <h2 className={`${ds.h2} mb-3`}>Explore more {isRental ? "rentals" : "homes"}</h2>
        <p className="mx-auto max-w-xl text-sm text-ds-body">
          We do not have close active matches right now. Browse the latest {isRental ? "rental" : "property"} listings instead.
        </p>
        <Link
          href={browseHref}
          className="mt-6 inline-flex rounded-xl bg-ds-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          Browse active {isRental ? "rentals" : "homes"}
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-20 border-t border-ds-card-border pt-16">
      <h2 className={`${ds.h2} mb-8`}>
        {sectionTitle ?? "Similar Properties"}
      </h2>
      <SimilarPropertiesClient
        sections={[
          {
            key: "for_this_home",
            title: "For This Home",
            items: recommendations.for_this_home,
          },
          {
            key: "based_on_your_history",
            title: "Based on Your History",
            items: recommendations.based_on_your_history,
          },
          {
            key: "people_also_viewed",
            title: "People Also Viewed",
            items: recommendations.people_also_viewed,
          },
          {
            key: "fallback",
            title: "More Homes You May Like",
            items: recommendations.fallback,
          },
        ]}
      />
    </section>
  );
}
