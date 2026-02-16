import React from "react";
import { ds } from "@/lib/design-system-utils";

interface PropertyHeaderProps {
  propertyType: string;
  city: string;
  address: string;
  status: string;
  price: string;
}

export default function PropertyHeader({
  propertyType,
  city,
  address,
  status,
  price,
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
        <h1 className={`${ds.h2} mb-2`}>
          {propertyType} in {city}
        </h1>
        <p className={`${ds.bodyRegular} text-ds-body flex items-center gap-2`}>
          {address}
        </p>
      </div>
      <div className="md:text-right">
        <p className="text-sm text-ds-body font-medium mb-1">List Price</p>
        <p className={`${ds.h1} text-ds-primary`}>{price}</p>
      </div>
    </div>
  );
}
