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

  // Use a translucent white with backdrop blur to match screenshot
  const containerCls = `${
    transparent
      ? "bg-white/70 backdrop-blur-sm border border-white/30"
      : "bg-white shadow rounded-lg border border-gray-200"
  } rounded-xl ${className}`;

  return (
    <div className={containerCls}>
      <div className="flex items-center gap-3 p-3 overflow-x-auto no-scrollbar">
        {/* Each control is compact with tiny labels */}
        <div className="flex flex-col min-w-[120px]">
          <label className="text-[10px] font-semibold text-gray-600 mb-1 uppercase">Property Type</label>
          <select
            value={filters.property_type}
            onChange={(e) => update("property_type", e.target.value)}
            className="px-2 py-1 border rounded-md bg-white text-sm"
          >
            <option value="">All</option>
            <option value="House">House</option>
            <option value="Condo">Condo</option>
            <option value="Townhouse">Townhouse</option>
          </select>
        </div>

        <div className="flex flex-col min-w-[84px]">
          <label className="text-[10px] font-semibold text-gray-600 mb-1 uppercase">Bedrooms</label>
          <input
            type="number"
            value={filters.bedrooms ?? ""}
            onChange={(e) => update("bedrooms", e.target.value)}
            className="px-2 py-1 border rounded-md text-sm"
            min={0}
            placeholder="Any"
          />
        </div>

        <div className="flex flex-col min-w-[84px]">
          <label className="text-[10px] font-semibold text-gray-600 mb-1 uppercase">Bathrooms</label>
          <input
            type="number"
            value={filters.bathrooms ?? ""}
            onChange={(e) => update("bathrooms", e.target.value)}
            className="px-2 py-1 border rounded-md text-sm"
            min={0}
            placeholder="Any"
          />
        </div>

        <div className="flex flex-col min-w-[110px]">
          <label className="text-[10px] font-semibold text-gray-600 mb-1 uppercase">Garage</label>
          <select
            value={filters.garage ?? ""}
            onChange={(e) => update("garage", e.target.value)}
            className="px-2 py-1 border rounded-md bg-white text-sm"
          >
            <option value="">All</option>
            <option value="attached">Attached</option>
            <option value="detached">Detached</option>
            <option value="none">None</option>
          </select>
        </div>

        <div className="flex flex-col min-w-[160px]">
          <label className="text-[10px] font-semibold text-gray-600 mb-1 uppercase">Prices</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={filters.price_min ?? ""}
              onChange={(e) => update("price_min", e.target.value)}
              className="px-2 py-1 border rounded-md text-sm w-24"
              placeholder="Min"
              min={0}
            />
            <input
              type="number"
              value={filters.price_max ?? ""}
              onChange={(e) => update("price_max", e.target.value)}
              className="px-2 py-1 border rounded-md text-sm w-24"
              placeholder="Max"
              min={0}
            />
          </div>
        </div>

        {/* Keyword expands to take remaining space */}
        <div className="flex flex-col min-w-[200px] flex-1">
          <label className="text-[10px] font-semibold text-gray-600 mb-1 uppercase">Keyword</label>
          <input
            type="text"
            value={filters.keywords ?? ""}
            onChange={(e) => update("keywords", e.target.value)}
            className="w-full px-2 py-1 border rounded-md text-sm"
            placeholder="pool, renovated, waterfront..."
          />
        </div>

        {/* Reset button minimal */}
        <button
          onClick={() =>
            setFilters((prev: any) => ({
              ...prev,
              price_min: "",
              price_max: "",
              bedrooms: "",
              bathrooms: "",
              property_type: "",
              garage: "",
              keywords: "",
            }))
          }
          className="px-3 py-1 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>

        {/* Search / Apply button on the right */}
        <div className="ml-2 flex-shrink-0">
          <button
            onClick={onApply}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium"
            style={{ backgroundColor: colors.primary ?? "#0f172a" }}
            title="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <span className="text-sm">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
