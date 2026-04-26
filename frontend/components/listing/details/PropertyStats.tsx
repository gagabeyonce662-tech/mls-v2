import React from "react";
import { Bed, Bath, Maximize, Calendar, Home as HomeIcon } from "lucide-react";
import { ds } from "@/lib/design-system-utils";

interface PropertyStatsProps {
  beds: string | number;
  baths: string | number;
  sqft: string;
  type: string;
  year: string | number;
}

export default function PropertyStats({
  beds,
  baths,
  sqft,
  type,
  year,
}: PropertyStatsProps) {
  const stats = [
    { label: "Bedrooms", value: beds, icon: Bed },
    { label: "Bathrooms", value: baths, icon: Bath },
    { label: "Living Area", value: sqft, icon: Maximize },
    { label: "Property Type", value: type, icon: HomeIcon },
    { label: "Year Built", value: year, icon: Calendar },
  ].filter((stat) => {
    const value = String(stat.value ?? "").trim().toLowerCase();
    return value && value !== "n/a" && value !== "null";
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-ds-card border border-ds-card-border p-4 rounded-xl flex flex-col items-center text-center transition-all hover:shadow-md"
        >
          <stat.icon className="w-5 h-5 text-ds-primary mb-2 opacity-80" />
          <span className="text-xs text-ds-body font-medium uppercase tracking-tight mb-1">
            {stat.label}
          </span>
          <span className={`${ds.body} font-bold text-ds-heading`}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
