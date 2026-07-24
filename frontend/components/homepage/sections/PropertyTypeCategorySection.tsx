"use client";

import { useMemo } from "react";
import { useOneRowListing } from "@/hooks/useOneRowListing";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import {
  fetchFilteredProperties,
  mapPropertyFromAPI,
} from "@/lib/api/properties";
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

  const categoryQuery = category.query ?? {};
  const queryKey = JSON.stringify(categoryQuery);

  const fetcher = useMemo(
    () => async (params: { limit: number; offset: number }) => {
      const data = await fetchFilteredProperties({
        ...params,
        ...categoryQuery,
      });

      const mapped = (data.results || []).map((item: any) =>
        mapPropertyFromAPI(item),
      );

      return {
        results: mapped,
        count: Number(data.count || mapped.length || 0),
        next: data.next ?? null,
        previous: data.previous ?? null,
      };
    },
    [queryKey],
  );

  const { properties, totalCount, isLoading, requestedCount } =
    useOneRowListing(fetcher, [queryKey]);

  const viewAllHref =
    Object.keys(categoryQuery).length > 0
      ? `${category.route}?${new URLSearchParams(categoryQuery).toString()}`
      : category.route;

  return (
    <PropertyGridSection
      title={category.label}
      subtitle={`${totalCount || properties.length} properties available`}
      viewAllHref={viewAllHref}
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
