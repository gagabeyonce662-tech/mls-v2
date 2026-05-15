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
  priceLabel = "List Price",
  priceClassName,
  rightActions,
}: PropertyHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-ds-primary/10 text-ds-primary text-xs font-bold rounded-full uppercase tracking-wider">
            {status}
          </span>
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
        {rightActions ? <div className="mt-3 md:ml-auto md:max-w-sm">{rightActions}</div> : null}
      </div>
    </div>
  );
}
