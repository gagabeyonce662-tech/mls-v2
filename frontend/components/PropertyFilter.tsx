"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Home,
  DollarSign,
  BedDouble,
  Bath,
  Maximize2,
  LandPlot,
  Sparkles,
} from "lucide-react";
import { colors } from "@/config/design-system";
import {
  fetchExclusiveProperties,
  type ExclusivePropertyFilterParams,
} from "@/lib/api";

import { FilterSection } from "@/components/ui/FilterSection";
import { PillButton } from "@/components/ui/PillButton";
import { StyledCheckbox } from "@/components/ui/StyledCheckbox";
import { FilterInput } from "@/components/shared/FilterInput";
import { useSearch } from "@/contexts/SearchContext";
import { useFilterState } from "@/hooks/useFilterState";

interface PropertyFilterProps {
  variant?: "sidebar" | "horizontal";
}

const propertyTypeMapping: { [key: string]: string } = {
  detached: "detached",
  "semi-detached": "semi-detached",
  "condo-apt": "Condo",
  "freehold-townhouse": "Townhouse",
  "condo-townhouse": "Townhouse",
  "Single-Family": "Single-Family",
  "Detached-Townhouse": "Detached-Townhouse",
};

const availablePropertyTypes = [
  "Detached",
  "Semi-Detached",
  "Condo Apt",
  "Freehold Townhouse",
  "Condo Townhouse",
];

export default function PropertyFilter({
  variant = "sidebar",
}: PropertyFilterProps) {
  const { applyFilters } = useSearch();
  const { state, setters, clearFilters, calculateActiveFilters } = useFilterState();
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const {
    searchQuery,
    notifyFor,
    propertyType,
    priceRange,
    bedrooms,
    bathrooms,
    garage,
    squareFootage,
    lotSize,
    rentalYield,
    schoolScore,
    basement,
    hasPhotos,
    limit,
    isLoading
  } = state;

  const {
    setSearchQuery,
    setNotifyFor,
    setPropertyType,
    setPriceRange,
    setBedrooms,
    setBathrooms,
    setGarage,
    setSquareFootage,
    setLotSize,
    setBasement,
    setHasPhotos,
    setLimit,
    setIsLoading
  } = setters;

  const fetchFilteredProperties = async () => {
    try {
      setIsLoading(true);
      const filters: ExclusivePropertyFilterParams = {};

      if (propertyType.length > 0) {
        const apiPropertyTypes = propertyType
          .map((type) => propertyTypeMapping[type] || type)
          .filter(Boolean)
          .filter((value, index, self) => self.indexOf(value) === index);
        if (apiPropertyTypes.length > 0) {
          filters.property_sub_type = apiPropertyTypes.join(",");
        }
      }

      if (searchQuery.trim()) filters.city = searchQuery.trim();

      if (priceRange.min) {
        const minValue = parseInt(priceRange.min.replace(/[^0-9]/g, ""));
        if (!isNaN(minValue) && minValue > 0) filters.price_min = minValue;
      }
      if (priceRange.max) {
        const maxValue = parseInt(priceRange.max.replace(/[^0-9]/g, ""));
        if (!isNaN(maxValue) && maxValue > 0) filters.price_max = maxValue;
      }

      if (bedrooms !== "all" && bedrooms !== "") {
        const bedroomNum = parseInt(bedrooms.replace("+", ""));
        if (!isNaN(bedroomNum) && bedroomNum > 0) filters.bedrooms = bedroomNum;
      }

      if (bathrooms !== "all" && bathrooms !== "") {
        const bathroomNum = parseInt(bathrooms.replace("+", ""));
        if (!isNaN(bathroomNum) && bathroomNum > 0)
          filters.bathrooms = bathroomNum;
      }

      if (notifyFor === "for-sale") filters.standard_status = "Active";
      else if (notifyFor === "sold") filters.standard_status = "Sold";

      if (hasPhotos !== null) filters.has_photos = hasPhotos;

      if (squareFootage.min) {
        const sqftMin = parseInt(squareFootage.min.replace(/[^0-9]/g, ""));
        if (!isNaN(sqftMin) && sqftMin > 0) filters.building_area_min = sqftMin;
      }
      if (squareFootage.max) {
        const sqftMax = parseInt(squareFootage.max.replace(/[^0-9]/g, ""));
        if (!isNaN(sqftMax) && sqftMax > 0) filters.building_area_max = sqftMax;
      }

      const response = await fetchExclusiveProperties(filters);
      const limitValue = parseInt(limit);
      let results = response.results || [];
      if (!isNaN(limitValue) && limitValue > 0) {
        results = results.slice(0, limitValue);
      }

      // Generate description
      const filterDescriptions = [];
      if (propertyType.length > 0) filterDescriptions.push(propertyType.join(", "));
      if (searchQuery.trim()) filterDescriptions.push(`City: ${searchQuery.trim()}`);
      if (priceRange.min || priceRange.max) filterDescriptions.push("Price Filtered");

      const query =
        filterDescriptions.length > 0
          ? `Filtered Results (${filterDescriptions.join(", ")})`
          : "All Properties";

      applyFilters(results, query);
      setActiveFiltersCount(calculateActiveFilters());
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    clearFilters();
    setActiveFiltersCount(0);
    applyFilters([], "");
  };

  if (variant === "horizontal") {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border p-4 mb-6" style={{ borderColor: colors.cardsBoarder }}>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by city..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={{ borderColor: colors.cardsBoarder }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchFilteredProperties()}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={fetchFilteredProperties}
              disabled={isLoading}
              className="flex-1 md:flex-none px-6 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              {isLoading ? "Searching..." : "Apply Filters"}
            </button>
            <button
              onClick={handleClear}
              className="p-2 border rounded-lg hover:bg-gray-50 transition-all"
              style={{ borderColor: colors.cardsBoarder }}
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Sidebar Layout */}
      <FilterSection title="Search Location" icon={Search}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by city..."
            className="w-full px-4 py-2.5 border rounded-lg text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </FilterSection>

      <FilterSection title="Property Type" icon={Home}>
        <div className="grid grid-cols-1 gap-2.5">
          {availablePropertyTypes.map((type) => (
            <StyledCheckbox
              key={type}
              label={type}
              checked={propertyType.includes(type.toLowerCase().replace(" ", "-"))}
              onChange={() => {
                const val = type.toLowerCase().replace(" ", "-");
                const isChecked = propertyType.includes(val);
                setPropertyType(isChecked ? propertyType.filter((t) => t !== val) : [...propertyType, val]);
              }}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range" icon={DollarSign}>
        <div className="flex items-center gap-3">
          <FilterInput
            label="Min"
            placeholder="No Min"
            value={priceRange.min}
            onChange={(val) => setPriceRange({ ...priceRange, min: val })}
            prefix="$"
          />
          <FilterInput
            label="Max"
            placeholder="No Max"
            value={priceRange.max}
            onChange={(val) => setPriceRange({ ...priceRange, max: val })}
            prefix="$"
          />
        </div>
      </FilterSection>

      <div className="grid grid-cols-2 gap-4">
        <FilterSection title="Beds" icon={BedDouble}>
          <select
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          >
            <option value="all">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </FilterSection>
        <FilterSection title="Baths" icon={Bath}>
          <select
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
          >
            <option value="all">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
        </FilterSection>
      </div>

      <div className="sticky bottom-0 p-4 bg-white border-t -mx-4 flex gap-3">
        <button
          onClick={fetchFilteredProperties}
          className="flex-1 py-2.5 rounded-lg text-white font-medium shadow-lg hover:opacity-90 transition-all"
          style={{ backgroundColor: colors.primary }}
        >
          {isLoading ? "Loading..." : "Apply Filters"}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2.5 border rounded-lg hover:bg-gray-50 transition-all"
          style={{ borderColor: colors.cardsBoarder }}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
