// frontend/components/listing/details/PropertyHeader.tsx
// This component is responsible for rendering the header section of a property listing detail page. It displays the headline, property type, location, price, and status of the listing. It also supports custom tags and a "Featured" badge for highlighted listings.

import React from "react";
import { ds } from "@/lib/design-system-utils";
import { cn } from "@/lib/utils";

interface PropertyHeaderProps {
  headline: string;
  propertyType: string;
  city: string;
  address: string;
  status: string;
  price: string;
  isFeaturedTag?: boolean;
  customTags?: string[];
  statusTags?: string[];
  priceLabel?: string;
  priceClassName?: string;
  rightActions?: React.ReactNode;
}

export default function PropertyHeader({
  headline,
  propertyType,
  city,
  address,
  status,
  price,
  isFeaturedTag = false,
  customTags = [],
  statusTags = [],
  priceLabel = "List Price",
  priceClassName,
  rightActions,
}: PropertyHeaderProps) {
  const visibleStatusTags = statusTags.length > 0 ? statusTags : [status].filter(Boolean);
  const visibleCustomTags = customTags.slice(0, 2);
  const hiddenCustomTagCount = Math.max(customTags.length - visibleCustomTags.length, 0);

  return (
    <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex max-w-4xl flex-wrap items-center gap-2">
          {isFeaturedTag ? (
            <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm">
              Featured
            </span>
          ) : null}
          {visibleStatusTags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full bg-ds-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ds-primary"
            >
              {tag}
            </span>
          ))}
          {visibleCustomTags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gray-700"
            >
              {tag}
            </span>
          ))}
          {hiddenCustomTagCount > 0 ? (
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gray-600">
              +{hiddenCustomTagCount} more
            </span>
          ) : null}
          <span className="text-sm font-medium text-ds-body">
            {propertyType}
          </span>
        </div>
        <h1 className={`${ds.h2} mb-2`}>{headline}</h1>
        <p className={`${ds.bodyRegular} text-ds-body flex items-center gap-2`}>
          {address}
        </p>
      </div>
      <div className="md:text-right">
        <p className="text-sm text-ds-body font-medium mb-1">{priceLabel}</p>
        <p className={cn(ds.h1, "text-ds-primary", priceClassName)}>{price}</p>
        {rightActions ? (
          <div className="mt-3 md:ml-auto md:max-w-sm">{rightActions}</div>
        ) : null}
      </div>
    </div>
  );
}
