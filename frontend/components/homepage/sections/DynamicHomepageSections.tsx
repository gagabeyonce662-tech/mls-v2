"use client";

import type { HomepageCategory } from "@/lib/api/types";
import { NewlyListedSection } from "./NewlyListedSection";
import { ExclusivePropertiesSection } from "./ExclusivePropertiesSection";
import { RentalPropertiesSection } from "./RentalPropertiesSection";
import { PreConstructionSection } from "./PreConstructionSection";
import { PropertyTypeCategorySection } from "./PropertyTypeCategorySection";

interface DynamicHomepageSectionsProps {
  categories: HomepageCategory[];
  useFallback: boolean;
}

export function DynamicHomepageSections({
  categories,
  useFallback,
}: DynamicHomepageSectionsProps) {
  if (useFallback) {
    return (
      <>
        <NewlyListedSection />
        <ExclusivePropertiesSection />
        <RentalPropertiesSection />
        <PreConstructionSection />
      </>
    );
  }

  return (
    <>
      {categories.map((category) => {
        switch (category.kind) {
          case "newly_listed":
            return <NewlyListedSection key={category.key} />;
          case "exclusive":
            return <ExclusivePropertiesSection key={category.key} />;
          case "rental":
            return <RentalPropertiesSection key={category.key} />;
          case "precon":
            return <PreConstructionSection key={category.key} />;
          case "property_type":
            return <PropertyTypeCategorySection key={category.key} category={category} />;
          default:
            return null;
        }
      })}
    </>
  );
}
