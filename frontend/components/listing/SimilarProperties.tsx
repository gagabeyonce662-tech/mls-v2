import React from "react";
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

  if (!hasAny) {
    return null;
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
