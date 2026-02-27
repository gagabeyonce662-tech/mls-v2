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

export default function FilterBar({
  filters,
  setFilters,
  onApply,
  transparent = false,
  vertical = false,
  className = "",
}: {
  filters: any;
  setFilters: (updater: any) => void;
  onApply: () => Promise<void> | void;
  transparent?: boolean;
  vertical?: boolean;
  className?: string;
}) {
  const update = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const containerCls = `
    ${transparent
      ? "bg-white/90 backdrop-blur-md border border-ds-card-border shadow-2xl"
      : "bg-white shadow-xl border border-ds-card-border"
    } rounded-2xl ${className}
  `;

  const inputCls =
    "w-full pl-9 pr-3 py-2 bg-ds-card/50 border border-ds-card-border rounded-xl text-sm text-ds-heading focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary transition-all outline-none font-medium placeholder:text-ds-body/30";
  const labelCls =
    "text-[10px] font-bold text-ds-body mb-1.5 uppercase tracking-widest pl-1";
  const iconCls =
    "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-primary";

  if (vertical) {
    return (
      <div className={containerCls}>
        <div className="flex flex-col gap-2 p-5 w-full">
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
                <option value="House">House</option>
                <option value="Condo">Condo</option>
                <option value="Townhouse">Townhouse</option>
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

  // Horizontal layout (default)
  return (
    <div className={containerCls}>
      <div className="flex items-center gap-6 p-4 overflow-x-auto no-scrollbar">
        {/* Property Type */}
        <div className="flex flex-col min-w-[140px]">
          <label className={labelCls}>Type</label>
          <div className="relative">
            <Home className={iconCls} />
            <select
              value={filters.property_type}
              onChange={(e) => update("property_type", e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="">All Types</option>
              <option value="House">House</option>
              <option value="Condo">Condo</option>
              <option value="Townhouse">Townhouse</option>
            </select>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="flex flex-col min-w-[100px]">
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
        <div className="flex flex-col min-w-[100px]">
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
        <div className="flex flex-col min-w-[130px]">
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
        <div className="flex flex-col min-w-[240px]">
          <label className={labelCls}>Price Range</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
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
            <div className="relative flex-1">
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

        {/* Keywords */}
        <div className="flex flex-col min-w-[180px] flex-1">
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
        <div className="flex items-end gap-2 ml-4">
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
            className="p-3 bg-ds-card border border-ds-card-border text-ds-body rounded-xl hover:bg-white hover:text-ds-primary hover:border-ds-primary transition-all group"
            title="Reset Filters"
          >
            <RotateCcw className="w-5 h-5 group-active:rotate-[-180deg] transition-transform" />
          </button>

          <button
            onClick={onApply}
            className="flex items-center gap-2 px-6 py-3 bg-ds-primary text-white font-bold rounded-xl shadow-lg shadow-ds-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            title="Apply Filters"
          >
            <Search className="w-5 h-5" />
            <span className="text-sm">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
