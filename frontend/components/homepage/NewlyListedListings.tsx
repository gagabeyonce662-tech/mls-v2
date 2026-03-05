// components/homepage/NewlyListedListings.tsx
"use client";

import { Calendar } from "lucide-react";
import { colors } from "@/config/design-system";
import { fetchNewlyListedProperties, type Property } from "@/lib/api";
import { useState, useEffect } from "react";
import { PropertyGridSection } from "../shared/PropertyGridSection";

interface NewlyListedListingsProps {
  searchQuery?: string;
  showLimit?: number;
  onQuickView?: (property: Property) => void;
}

export default function NewlyListedListings({
  searchQuery = "",
  showLimit = 8,
  onQuickView,
}: NewlyListedListingsProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchNewlyListedProperties({
          limit: showLimit,
          search:
            searchQuery && searchQuery !== "Latest Properties"
              ? searchQuery
              : undefined,
        });
        setProperties(response.results || []);
        setTotalCount(response.count || (response.results || []).length);
      } catch (error) {
        console.error("Error fetching newly listed properties:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [showLimit, searchQuery]);

  return (
    <PropertyGridSection
      title={searchQuery || "Newly Listed Properties"}
      subtitle={
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: colors.primary }} />
          <span>{isLoading ? "Finding new listings..." : `${totalCount} new properties available`}</span>
        </div>
      }
      viewAllHref="/new-listings"
      viewAllLabel="View All New Listings"
      properties={properties}
      isLoading={isLoading}
      isError={isError}
      totalCount={totalCount}
      onQuickView={onQuickView}
      variant="new"
      limit={showLimit}
    />
  );
}
