"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Map,
  LayoutGrid,
} from "lucide-react";
import { colors } from "@/config/design-system";
import {
  fetchPropertyTypes,
  type ExclusivePropertyFilterParams,
  type PropertyTypeOption,
} from "@/lib/api";

import { FilterSection } from "@/components/ui/FilterSection";
import { PillButton } from "@/components/ui/PillButton";
import { StyledCheckbox } from "@/components/ui/StyledCheckbox";
import { FilterInput } from "@/components/shared/FilterInput";
import { useSearch } from "@/contexts/SearchContext";
import { useFilterState } from "@/hooks/useFilterState";
import { cn } from "@/lib/utils";
import { filtersToSearchParams } from "@/lib/searchParams";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyFilterProps {
  variant?: "sidebar" | "horizontal";
  onApplyFilters?: (filters: ExclusivePropertyFilterParams) => void;
  initialCity?: string;
  isSticky?: boolean;
}

const toTypeKey = (value: string) => value.toLowerCase().replace(/\s+/g, "-");
const formatTypeLabel = (type: PropertyTypeOption) =>
  typeof type.count === "number" ? `${type.label} (${type.count})` : type.label;

export default function PropertyFilter({
  variant = "sidebar",
  onApplyFilters,
  initialCity,
  isSticky = false,
}: PropertyFilterProps) {
  const router = useRouter();
  const { viewMode, toggleViewMode } = useSearch();
  const { state, setters, clearFilters } = useFilterState();
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<
    PropertyTypeOption[]
  >([]);

  // Sync initial city from URL into the filter input
  useState(() => {
    if (initialCity) setters.setSearchQuery(initialCity);
  });

  useEffect(() => {
    let mounted = true;

    const loadPropertyTypes = async () => {
      const types = await fetchPropertyTypes({ listing_type: "exclusive" });
      if (mounted) setAvailablePropertyTypes(types);
    };

    loadPropertyTypes();
    return () => {
      mounted = false;
    };
  }, []);

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
    isLoading,
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
    setIsLoading,
  } = setters;

  const buildFilters = (): ExclusivePropertyFilterParams => {
    const filters: ExclusivePropertyFilterParams = {};

    if (propertyType.length > 0) {
      const apiPropertyTypes = propertyType
        .map(
          (type) =>
            availablePropertyTypes.find((opt) => toTypeKey(opt.value) === type)
              ?.value || type,
        )
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
      if (!isNaN(bathroomNum) && bathroomNum > 0) filters.bathrooms = bathroomNum;
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

    const limitValue = parseInt(limit);
    if (!isNaN(limitValue) && limitValue > 0) {
      filters.limit = limitValue;
    }

    return filters;
  };

  const fetchFilteredProperties = async () => {
    try {
      setIsLoading(true);
      const filters = buildFilters();

      if (onApplyFilters) {
        onApplyFilters(filters);
        return;
      }

      const params = filtersToSearchParams(filters).toString();
      const target = params ? `/search-results?${params}` : "/search-results";
      router.push(target);
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    clearFilters();
    if (onApplyFilters) {
      onApplyFilters({});
      return;
    }
    router.push("/search-results");
  };

  if (variant === "horizontal") {
    const intents = [
      { id: "for-sale", label: "Buy" },
      { id: "for-rent", label: "Rent" },
      { id: "sold", label: "Sold" },
    ];

    const currentIntent = notifyFor || "for-sale";

    return (
      <div
        className={cn(
          "w-full bg-white border transition-all duration-500 hover:shadow-lg origin-top",
          isSticky
            ? "rounded-b-2xl shadow-lg p-2.5 sm:p-3 mb-0 border-t-0"
            : "rounded-2xl shadow-md p-4 sm:p-6 mb-6",
        )}
        style={{ borderColor: "#E5E5E5" }}
      >
        {/* Intent Tabs */}
        <div
          className={cn(
            "flex items-center gap-6 border-b border-gray-100 transition-all duration-500",
            isSticky ? "mb-2 pb-0 opacity-0 h-0 overflow-hidden" : "mb-5 pb-1 opacity-100",
          )}
        >
          {intents.map((intent) => (
            <button
              key={intent.id}
              onClick={() => setNotifyFor(intent.id)}
              className={`pb-3 text-sm sm:text-base font-semibold transition-all relative ${
                currentIntent === intent.id
                  ? "text-ds-primary"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {intent.label}
              {currentIntent === intent.id && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-ds-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Search Bar & Actions */}
        <div
          className={cn(
            "flex flex-col md:flex-row items-stretch md:items-center transition-all duration-500",
            isSticky ? "gap-2" : "gap-3",
          )}
        >
          <div className="flex-1 w-full relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={
                currentIntent === "for-sale"
                  ? "Search cities, postal codes..."
                  : currentIntent === "for-rent"
                    ? "Search rental locations..."
                    : "Search recently sold..."
              }
              className={cn(
                "w-full pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary focus:bg-white transition-all",
                isSticky ? "py-2.5 text-sm" : "py-3.5 text-sm sm:text-base",
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchFilteredProperties();
                }
              }}
            />
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Select
              value={propertyType[0] || "all"}
              onValueChange={(val) =>
                setPropertyType(val === "all" ? [] : [val])
              }
            >
              <SelectTrigger
                className={cn(
                  "w-[150px] h-auto bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-ds-primary/20 hover:bg-white transition-all shadow-none",
                  isSticky ? "py-2.5" : "py-3.5",
                )}
              >
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-gray-100">
                <SelectItem value="all" className="font-medium">
                  All Types
                </SelectItem>
                {availablePropertyTypes.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={toTypeKey(type.value)}
                    className="cursor-pointer"
                  >
                    {formatTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priceRange.max || "all"}
              onValueChange={(val) =>
                setPriceRange({ ...priceRange, max: val === "all" ? "" : val })
              }
            >
              <SelectTrigger
                className={cn(
                  "w-[130px] h-auto bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-ds-primary/20 hover:bg-white transition-all shadow-none",
                  isSticky ? "py-2.5" : "py-3.5",
                )}
              >
                <SelectValue placeholder="Max Price" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-gray-100">
                <SelectItem value="all" className="font-medium">
                  Any Price
                </SelectItem>
                <SelectItem value="500000" className="cursor-pointer">
                  $500k
                </SelectItem>
                <SelectItem value="800000" className="cursor-pointer">
                  $800k
                </SelectItem>
                <SelectItem value="1000000" className="cursor-pointer">
                  $1M
                </SelectItem>
                <SelectItem value="1500000" className="cursor-pointer">
                  $1.5M
                </SelectItem>
                <SelectItem value="2000000" className="cursor-pointer">
                  $2M+
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={bedrooms || "all"}
              onValueChange={(val) => setBedrooms(val)}
            >
              <SelectTrigger
                className={cn(
                  "w-[110px] h-auto bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-ds-primary/20 hover:bg-white transition-all shadow-none",
                  isSticky ? "py-2.5" : "py-3.5",
                )}
              >
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-gray-100">
                <SelectItem value="all" className="font-medium">
                  Any Beds
                </SelectItem>
                <SelectItem value="1" className="cursor-pointer">
                  1+ Beds
                </SelectItem>
                <SelectItem value="2" className="cursor-pointer">
                  2+ Beds
                </SelectItem>
                <SelectItem value="3" className="cursor-pointer">
                  3+ Beds
                </SelectItem>
                <SelectItem value="4" className="cursor-pointer">
                  4+ Beds
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={bathrooms || "all"}
              onValueChange={(val) => setBathrooms(val)}
            >
              <SelectTrigger
                className={cn(
                  "w-[110px] h-auto bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-ds-primary/20 hover:bg-white transition-all shadow-none",
                  isSticky ? "py-2.5" : "py-3.5",
                )}
              >
                <SelectValue placeholder="Baths" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-gray-100">
                <SelectItem value="all" className="font-medium">
                  Any Baths
                </SelectItem>
                <SelectItem value="1" className="cursor-pointer">
                  1+ Baths
                </SelectItem>
                <SelectItem value="2" className="cursor-pointer">
                  2+ Baths
                </SelectItem>
                <SelectItem value="3" className="cursor-pointer">
                  3+ Baths
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={fetchFilteredProperties}
              disabled={isLoading}
              className={cn(
                "flex-1 md:flex-none px-8 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50 hover:shadow-md flex items-center justify-center gap-2",
                isSticky ? "py-2.5 text-sm" : "py-3.5",
              )}
              style={{ backgroundColor: "#1E3A8A" }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                "Search"
              )}
            </button>
            <button
              onClick={handleClear}
              className={cn(
                "border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-all text-gray-500 hover:text-gray-800",
                isSticky ? "p-2.5" : "p-3.5",
              )}
              title="Reset Search"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={toggleViewMode}
              className={cn(
                "border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-all text-gray-500 hover:text-gray-800 hidden lg:flex items-center",
                isSticky ? "p-2.5" : "p-3.5",
              )}
              title={
                viewMode === "grid"
                  ? "Switch to Map View"
                  : "Switch to Grid View"
              }
            >
              {viewMode === "grid" ? (
                <Map className="w-5 h-5" />
              ) : (
                <LayoutGrid className="w-5 h-5" />
              )}
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
              key={type.value}
              label={formatTypeLabel(type)}
              checked={propertyType.includes(
                toTypeKey(type.value),
              )}
              onChange={() => {
                const val = toTypeKey(type.value);
                const isChecked = propertyType.includes(val);
                setPropertyType(
                  isChecked
                    ? propertyType.filter((t) => t !== val)
                    : [...propertyType, val],
                );
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
