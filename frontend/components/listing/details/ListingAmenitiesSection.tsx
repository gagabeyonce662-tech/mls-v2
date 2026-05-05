"use client";

import { useMemo } from "react";
import { ds } from "@/lib/design-system-utils";
import type { NearbyAmenitiesResponse } from "@/lib/api";

type AmenityCategory = "groceries" | "cafes" | "parks" | "transit";

const LABELS: Record<AmenityCategory, string> = {
  groceries: "Groceries",
  cafes: "Cafes",
  parks: "Parks",
  transit: "Transit",
};

export default function ListingAmenitiesSection({
  amenities,
}: {
  amenities: NearbyAmenitiesResponse | null;
}) {
  const sections = useMemo(() => {
    if (!amenities) return [];
    const categories = amenities.categories;
    return (Object.keys(categories) as AmenityCategory[]).map((key) => ({
      key,
      label: LABELS[key],
      items: categories[key].slice(0, 6),
    }));
  }, [amenities]);

  if (!amenities || sections.every((section) => section.items.length === 0)) {
    return null;
  }

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <h2 className={`${ds.h3} mb-2`}>Nearby amenities</h2>
      <p className="text-xs text-ds-body mb-4">
        OpenStreetMap points-of-interest around this listing.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div
            key={section.key}
            className="rounded-xl border border-ds-card-border bg-ds-card/30 p-4"
          >
            <h3 className="text-sm font-semibold text-ds-heading mb-2">
              {section.label}
            </h3>
            {section.items.length === 0 ? (
              <p className="text-xs text-ds-body">No data in this radius.</p>
            ) : (
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={`${section.key}-${item.osm_id}`} className="text-xs">
                    <span className="font-medium text-ds-heading">{item.name}</span>
                    {item.address ? (
                      <span className="text-ds-body"> - {item.address}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
