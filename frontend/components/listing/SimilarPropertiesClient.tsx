"use client";

import React, { useEffect, useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import type { RecommendationItem } from "@/lib/api";
import { PropertyQuickViewModal } from "./PropertyQuickViewModal";
import { API_BASE_URL } from "@/lib/api";

interface SimilarPropertiesClientProps {
  sections: Array<{
    key: string;
    title: string;
    items: RecommendationItem[];
  }>;
}

export default function SimilarPropertiesClient({
  sections,
}: SimilarPropertiesClientProps) {
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewProperty, setQuickViewProperty] = useState<any>(null);

  const visibleSections = useMemo(
    () => sections.filter((section) => section.items.length > 0),
    [sections],
  );

  useEffect(() => {
    const seen = new Set<string>();
    visibleSections.forEach((section) => {
      section.items.slice(0, 6).forEach((item) => {
        const listingKey = String(
          item.property.listing_key || item.property.ListingKey || "",
        );
        if (!listingKey || seen.has(`${section.key}:${listingKey}`)) return;
        seen.add(`${section.key}:${listingKey}`);
        fetch(`${API_BASE_URL}/api/mls/properties/recommendations/track/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            listing_key: listingKey,
            event_type: "impression",
            section: section.key,
            metadata: { source: "similar_properties_section" },
          }),
        }).catch(() => {});
      });
    });
  }, [visibleSections]);

  const handleQuickView = (property: any) => {
    const listingKey = String(property?.listing_key || property?.ListingKey || "");
    if (listingKey) {
      fetch(`${API_BASE_URL}/api/mls/properties/recommendations/track/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          listing_key: listingKey,
          event_type: "click",
          metadata: { source: "quick_view" },
        }),
      }).catch(() => {});
    }
    setQuickViewProperty(property);
    setShowQuickView(true);
  };

  return (
    <div className="space-y-10">
      {visibleSections.map((section) => (
          <div key={section.key}>
            <h3 className="text-lg font-semibold text-ds-heading mb-4">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {section.items.map((item, index) => (
                <div key={`${section.key}-${item.property.listing_key || item.property.ListingKey || index}`}>
                  <PropertyCard
                    property={item.property}
                    variant="featured"
                    index={index}
                    onQuickView={handleQuickView}
                  />
                  {!!item.why?.length && (
                    <p className="mt-2 text-[11px] text-ds-body">
                      Why: {item.why.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      <PropertyQuickViewModal
        show={showQuickView}
        property={quickViewProperty}
        onClose={() => setShowQuickView(false)}
      />
    </div>
  );
}
