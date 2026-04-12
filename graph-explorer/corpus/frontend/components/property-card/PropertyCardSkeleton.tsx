"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { propertyCard } from "@/config/design-system";

export function PropertyCardSkeleton() {
  return (
    <div
      className={`relative ${propertyCard.layout.borderRadius} overflow-hidden bg-white border border-ds-card-border`}
    >
      {/* Image area */}
      <Skeleton
        className={`${propertyCard.layout.imageHeight} w-full rounded-none`}
      />

      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Price */}
        <Skeleton className="h-7 w-1/2" />

        {/* Title */}
        <Skeleton className="h-5 w-3/4" />

        {/* Address */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>

        {/* Divider */}
        <div className="border-t border-ds-card-border my-2" />

        {/* Features row */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}
