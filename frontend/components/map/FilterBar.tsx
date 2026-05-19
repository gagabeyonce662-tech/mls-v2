// components/map/FilterBar.tsx
import React from "react";
import {
  Search,
  RotateCcw,
  Home,
  Bed,
  Bath,
  Car,
  DollarSign,
  Tag,
} from "lucide-react";

const PROPERTY_TYPE_OPTIONS = [
  "Detached",
  "Semi-Detached",
  "Freehold Townhouse",
  "Condo Townhouse",
  "Condo Apt",
  "Link",
  "Multiplex",
  "Vacant Land",
  "House",
  "Condo",
  "Townhouse",
];

export default function FilterBar({
  filters,
  setFilters,
  onApply,
  className = "",
}: {
  filters: any;
  setFilters: (updater: any) => void;
  onApply: () => Promise<void> | void;
  className?: string;
}) {
  const update = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const containerCls = `bg-white shadow-xl border border-ds-card-border rounded-2xl ${className}`;

  const inputCls =
    "w-full pl-9 pr-3 py-2 bg-ds-card/50 border border-ds-card-border rounded-xl text-sm text-ds-heading focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary transition-all outline-none font-medium placeholder:text-ds-body/30";
  const labelCls =
    "text-xs font-bold text-ds-body mb-1.5 uppercase tracking-wide pl-1";
  const iconCls =
    "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-primary";

  return (
    <div className={containerCls}>
      <div className="flex flex-col gap-2 p-5 w-full">
        {/* Transaction Type */}
        <div className="flex flex-col">
          <label className={labelCls}>Transaction</label>
          <div className="relative">
            <Tag className={iconCls} />
            <select
              value={filters.transaction_type ?? "sale"}
              onChange={(e) => update("transaction_type", e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>
        </div>

        {/* Property Type */}
        <div className="flex flex-col">
          <label className={labelCls}>Type</label>
          <div className="relative">
            <Home className={iconCls} />
            <select
              value={filters.property_type}
              onChange={(e) => update("property_type", e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="">All Types</option>
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="flex flex-col">
          <label className={labelCls}>Beds</label>
          <div className="relative">
            <Bed className={iconCls} />
            <input
              type="number"
              value={filters.bedrooms ?? ""}
              onChange={(e) => update("bedrooms", e.target.value)}
              className={inputCls}
              min={0}
              placeholder="Any"
            />
          </div>
        </div>

        {/* Bathrooms */}
        <div className="flex flex-col">
          <label className={labelCls}>Baths</label>
          <div className="relative">
            <Bath className={iconCls} />
            <input
              type="number"
              value={filters.bathrooms ?? ""}
              onChange={(e) => update("bathrooms", e.target.value)}
              className={inputCls}
              min={0}
              placeholder="Any"
            />
          </div>
        </div>

        {/* Garage */}
        <div className="flex flex-col">
          <label className={labelCls}>Garage</label>
          <div className="relative">
            <Car className={iconCls} />
            <select
              value={filters.garage ?? ""}
              onChange={(e) => update("garage", e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="">Any</option>
              <option value="attached">Attached</option>
              <option value="detached">Detached</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div className="flex flex-col">
          <label className={labelCls}>Price Range</label>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <DollarSign className={iconCls} />
              <input
                type="number"
                value={filters.price_min ?? ""}
                onChange={(e) => update("price_min", e.target.value)}
                className={inputCls}
                placeholder="Min"
                min={0}
              />
            </div>
            <div className="relative">
              <DollarSign className={iconCls} />
              <input
                type="number"
                value={filters.price_max ?? ""}
                onChange={(e) => update("price_max", e.target.value)}
                className={inputCls}
                placeholder="Max"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Building Size */}
        <div className="flex flex-col">
          <label className={labelCls}>House Size (Sqft)</label>
          <div className="flex flex-col gap-2">
            <input
              type="number"
              value={filters.building_area_min ?? ""}
              onChange={(e) => update("building_area_min", e.target.value)}
              className={inputCls}
              placeholder="Min sqft"
              min={0}
            />
            <input
              type="number"
              value={filters.building_area_max ?? ""}
              onChange={(e) => update("building_area_max", e.target.value)}
              className={inputCls}
              placeholder="Max sqft"
              min={0}
            />
          </div>
        </div>

        {/* Lot Size */}
        <div className="flex flex-col">
          <label className={labelCls}>Lot Size</label>
          <div className="flex flex-col gap-2">
            <input
              type="number"
              value={filters.lot_size_min ?? ""}
              onChange={(e) => update("lot_size_min", e.target.value)}
              className={inputCls}
              placeholder="Min lot"
              min={0}
            />
            <input
              type="number"
              value={filters.lot_size_max ?? ""}
              onChange={(e) => update("lot_size_max", e.target.value)}
              className={inputCls}
              placeholder="Max lot"
              min={0}
            />
          </div>
        </div>

        {/* Parking */}
        <div className="flex flex-col">
          <label className={labelCls}>Parking Spaces</label>
          <div className="relative">
            <Car className={iconCls} />
            <input
              type="number"
              value={filters.parking_min ?? ""}
              onChange={(e) => update("parking_min", e.target.value)}
              className={inputCls}
              min={0}
              placeholder="Any"
            />
          </div>
        </div>

        {/* Keywords */}
        <div className="flex flex-col">
          <label className={labelCls}>Keywords</label>
          <div className="relative">
            <Tag className={iconCls} />
            <input
              type="text"
              value={filters.keywords ?? ""}
              onChange={(e) => update("keywords", e.target.value)}
              className={inputCls}
              placeholder="pool, view..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
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
                transaction_type: "sale",
                statuses: [],
                active_listed_within: "",
                building_area_min: "",
                building_area_max: "",
                lot_size_min: "",
                lot_size_max: "",
                parking_min: "",
                watched_area_key: "",
                watched_area_city: "",
                watched_area_community_slug: "",
                watched_area_label: "",
              }))
            }
            className="flex-1 p-2.5 bg-ds-card border border-ds-card-border text-ds-body rounded-xl hover:bg-white hover:text-ds-primary hover:border-ds-primary transition-all group flex items-center justify-center"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4 group-active:rotate-[-180deg] transition-transform" />
          </button>

          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-ds-primary text-white font-bold rounded-xl shadow-lg shadow-ds-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
            title="Apply Filters"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
