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
  priceLabel = "List Price",
  priceClassName,
  rightActions,
}: PropertyHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {isFeaturedTag ? (
            <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold rounded-full uppercase tracking-wider shadow-sm">
              Featured
            </span>
          ) : (
            <span className="px-3 py-1 bg-ds-primary/10 text-ds-primary text-xs font-bold rounded-full uppercase tracking-wider">
              {status}
            </span>
          )}
          {customTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-full tracking-wide"
            >
              {tag}
            </span>
          ))}
          <span className="text-ds-body text-sm font-medium">
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
