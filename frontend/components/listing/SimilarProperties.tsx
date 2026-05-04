import React from "react";
import { fetchSimilarProperties } from "@/lib/api";
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
  const similarProperties = await fetchSimilarProperties(property, 3);

  if (similarProperties.length === 0) {
    return null;
  }

  return (
    <section className="mt-20 border-t border-ds-card-border pt-16">
      <h2 className={`${ds.h2} mb-8`}>
        {sectionTitle ?? "Similar Properties"}
      </h2>
      <SimilarPropertiesClient properties={similarProperties} />
    </section>
  );
}
