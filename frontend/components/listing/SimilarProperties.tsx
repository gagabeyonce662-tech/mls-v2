import React from "react";
import { fetchSimilarProperties } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { ds } from "@/lib/design-system-utils";
import type { Property } from "@/lib/api";

interface SimilarPropertiesProps {
  property: Property;
}

export default async function SimilarProperties({
  property,
}: SimilarPropertiesProps) {
  const similarProperties = await fetchSimilarProperties(property, 3);

  if (similarProperties.length === 0) {
    return null;
  }

  return (
    <section className="mt-20 border-t border-ds-card-border pt-16">
      <h2 className={`${ds.h2} mb-8`}>Similar Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {similarProperties.map((prop, index) => (
          <PropertyCard
            key={prop.listing_key || prop.ListingKey || index}
            property={prop}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
