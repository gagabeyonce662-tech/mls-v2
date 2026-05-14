import React from "react";
import { Bed, Bath, Maximize, Calendar, Home as HomeIcon } from "lucide-react";

interface PropertyStatsProps {
  beds: string | number;
  baths: string | number;
  sqft: string;
  type: string;
  year: string | number;
  garages?: string;
  showPropertyType?: boolean;
}

export default function PropertyStats({
  beds,
  baths,
  sqft,
  type,
  year,
  garages,
  showPropertyType = true,
}: PropertyStatsProps) {
  const stats = [
    { label: "Bedrooms", value: beds, icon: Bed },
    { label: "Bathrooms", value: baths, icon: Bath },
    { label: "Living Area", value: sqft, icon: Maximize },
    ...(showPropertyType
      ? [{ label: "Property Type", value: type, icon: HomeIcon }]
      : []),
    { label: "Year Built", value: year, icon: Calendar },
    { label: "Garages", value: garages ?? "", icon: HomeIcon },
  ].filter((stat) => {
    const value = String(stat.value ?? "").trim().toLowerCase();
    return value && value !== "n/a" && value !== "null";
  });

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-1.5 text-sm">
          <stat.icon className="w-3.5 h-3.5 text-ds-primary shrink-0" />
          <span className="text-ds-body">{stat.label}:</span>
          <span className="font-semibold text-ds-heading">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
