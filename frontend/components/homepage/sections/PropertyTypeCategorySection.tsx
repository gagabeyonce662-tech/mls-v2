"use client";

import { useMemo } from "react";
import { useOneRowListing } from "@/hooks/useOneRowListing";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { fetchFilteredProperties } from "@/lib/api/properties";
import { mapPropertyFromAPI } from "@/lib/api/properties";
import { useQuickView } from "@/contexts/QuickViewContext";
import type { HomepageCategory } from "@/lib/api/types";
import { trackHomepageCategoryEvent } from "@/lib/analytics/homepageCategories";

interface PropertyTypeCategorySectionProps {
  category: HomepageCategory;
}

export function PropertyTypeCategorySection({
  category,
}: PropertyTypeCategorySectionProps) {
  const { openQuickView } = useQuickView();
  const propertyType = category.query?.property_type || "";

  const fetcher = useMemo(
    () => async (params: { limit: number; offset: number }) => {
      const data = await fetchFilteredProperties({
        ...params,
        property_sub_type: propertyType,
      });
      const mapped = (data.results || []).map((item: any) => mapPropertyFromAPI(item));
      return {
        results: mapped,
        count: Number(data.count || mapped.length || 0),
        next: data.next ?? null,
        previous: data.previous ?? null,
      };
    },
    [propertyType],
  );

  const { properties, totalCount, isLoading, requestedCount } = useOneRowListing(fetcher, [
    propertyType,
  ]);

  return (
    <PropertyGridSection
      title={category.label}
      subtitle={`${totalCount || properties.length} properties available`}
      viewAllHref={
        category.query && Object.keys(category.query).length > 0
          ? `${category.route}?${new URLSearchParams({
              property_sub_type: propertyType,
            }).toString()}`
          : category.route
      }
      properties={properties}
      totalCount={totalCount}
      isLoading={isLoading}
      onQuickView={openQuickView}
      oneRowOnly={true}
      limit={requestedCount}
      onViewAllClick={() =>
        trackHomepageCategoryEvent("homepage_category_view_all", {
          key: category.key,
          label: category.label,
          route: category.route,
        })
      }
    />
  );
}
