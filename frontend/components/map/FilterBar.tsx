// components/map/FilterBar.tsx
import { colors } from "@/config/design-system";
import React from "react";

export default function FilterBar({
  filters,
  setFilters,
  onApply,
  transparent = false,
  className = "",
}: {
  filters: any;
  setFilters: (updater: any) => void;
  onApply: () => Promise<void> | void;
  transparent?: boolean;
  className?: string;
}) {
  const update = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  // Show visible boundary even when transparent, so the controls are clearly grouped.
  const containerCls = `${
    transparent
      ? "bg-transparent border border-gray-300 rounded-lg"
      : "bg-white shadow rounded-lg border border-gray-200"
  } ${className}`;

  return (
    <div className={containerCls}>
      <div className="flex items-end gap-4 p-3 flex-wrap">
        {/* Property Type */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">Property Type</label>
          <select
            value={filters.property_type}
            onChange={(e) => update("property_type", e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="">All</option>
            <option value="House">House</option>
            <option value="Condo">Condo</option>
            <option value="Townhouse">Townhouse</option>
          </select>
        </div>

        {/* Bedrooms */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">Bedrooms</label>
          <input
            type="number"
            value={filters.bedrooms ?? ""}
            onChange={(e) => update("bedrooms", e.target.value)}
            className="px-3 py-2 border rounded-md w-20 bg-white"
            min={0}
          />
        </div>

        {/* Bathrooms */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">Bathrooms</label>
          <input
            type="number"
            value={filters.bathrooms ?? ""}
            onChange={(e) => update("bathrooms", e.target.value)}
            className="px-3 py-2 border rounded-md w-20 bg-white"
            min={0}
          />
        </div>

        {/* Min Price */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">Min Price</label>
          <input
            type="number"
            value={filters.price_min ?? ""}
            onChange={(e) => update("price_min", e.target.value)}
            className="px-3 py-2 border rounded-md w-28 bg-white"
            min={0}
          />
        </div>

        {/* Max Price */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">Max Price</label>
          <input
            type="number"
            value={filters.price_max ?? ""}
            onChange={(e) => update("price_max", e.target.value)}
            className="px-3 py-2 border rounded-md w-28 bg-white"
            min={0}
          />
        </div>

        {/* Keyword */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-600">Keyword</label>
          <input
            type="text"
            value={filters.keywords ?? ""}
            onChange={(e) => update("keywords", e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-white"
            placeholder="pool, renovated, waterfront..."
          />
        </div>

        {/* Reset / Apply */}
        <div className="flex items-end gap-2 ml-auto">
          <button
            onClick={() =>
              setFilters((prev: any) => ({
                ...prev,
                price_min: "",
                price_max: "",
                bedrooms: "",
                bathrooms: "",
                property_type: "",
                keywords: "",
              }))
            }
            className="px-3 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>

          <button
            onClick={onApply}
            className="text-white px-4 py-2 rounded-md text-sm"
            style={{ backgroundColor: colors.primary }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
