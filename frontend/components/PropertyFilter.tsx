"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Home,
  DollarSign,
  BedDouble,
  Bath,
  Maximize2,
  LandPlot,
} from "lucide-react";
import { colors } from "@/config/design-system";
import {
  fetchExclusiveProperties,
  testExclusiveEndpoint,
  type ExclusivePropertyFilterParams,
} from "@/lib/api";

/* ================================================================== */
/*  Types & Props                                                     */
/* ================================================================== */
interface PropertyFilterProps {
  onPropertiesUpdate?: (properties: any[], query: string) => void;
}

import { FilterSection } from "@/components/ui/FilterSection";
import { PillButton } from "@/components/ui/PillButton";
import { StyledCheckbox } from "@/components/ui/StyledCheckbox";

/* ================================================================== */
/*  Text Input                                                        */
/* ================================================================== */
function FilterInput({
  label,
  placeholder,
  value,
  onChange,
  prefix,
  suffix,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex-1">
      <label
        className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: colors.body }}
      >
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium pointer-events-none"
            style={{ color: colors.body }}
          >
            {prefix}
          </span>
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          disabled={disabled}
          className="w-full py-2.5 border rounded-lg text-[13px] transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: colors.cardsBoarder,
            color: colors.heading,
            backgroundColor: colors.cards,
            paddingLeft: prefix ? "24px" : "12px",
            paddingRight: suffix ? "48px" : "12px",
            // @ts-ignore
            "--tw-ring-color": `${colors.primary}40`,
          }}
        />
        {suffix && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium pointer-events-none"
            style={{ color: colors.body }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                    */
/* ================================================================== */
export default function PropertyFilter({
  onPropertiesUpdate,
}: PropertyFilterProps) {
  /* ── state ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [notifyFor, setNotifyFor] = useState("all");
  const [propertyType, setPropertyType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [bedrooms, setBedrooms] = useState("all");
  const [bathrooms, setBathrooms] = useState("all");
  const [garage, setGarage] = useState("all");
  const [squareFootage, setSquareFootage] = useState({ min: "", max: "" });
  const [lotSize, setLotSize] = useState({ min: "", max: "" });
  const [rentalYield, setRentalYield] = useState({ min: "", max: "" });
  const [schoolScore, setSchoolScore] = useState({ min: "", max: "" });
  const [basement, setBasement] = useState<string[]>([]);
  const [openHouse, setOpenHouse] = useState("unspecified");
  const [listingType, setListingType] = useState("all");
  const [hasPhotos, setHasPhotos] = useState<boolean | null>(null);
  const [limit, setLimit] = useState("50");

  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [testResult, setTestResult] = useState<string>("");

  /* ── mappings ── */
  const propertyTypeMapping: { [key: string]: string } = {
    detached: "detached",
    "semi-detached": "semi-detached",
    "condo-apt": "Condo",
    "freehold-townhouse": "Townhouse",
    "condo-townhouse": "Townhouse",
    "Single-Family": "Single-Family",
    multiplex: "Multiplex",
    "vacant-land": "Vacant Land",
  };

  const availablePropertyTypes = [
    "Detached",
    "Semi-Detached",
    "Condo Apt",
    "Freehold Townhouse",
    "Condo Townhouse",
    "Single-Family",
    "Multiplex",
    "Vacant Land",
  ];

  /* ── helpers ── */
  const togglePropertyType = (type: string) => {
    const formattedType = type.toLowerCase().replace(" ", "-");
    setPropertyType((prev) =>
      prev.includes(formattedType)
        ? prev.filter((t) => t !== formattedType)
        : [...prev, formattedType],
    );
  };

  const selectAllPropertyTypes = () => {
    setPropertyType(
      availablePropertyTypes.map((t) => t.toLowerCase().replace(" ", "-")),
    );
  };

  const clearPropertyTypes = () => setPropertyType([]);

  const calculateActiveFilters = useCallback(() => {
    let count = 0;
    if (propertyType.length > 0) count++;
    if (priceRange.min || priceRange.max) count++;
    if (bedrooms !== "all") count++;
    if (bathrooms !== "all") count++;
    if (searchQuery.trim()) count++;
    if (notifyFor !== "all") count++;
    if (squareFootage.min || squareFootage.max) count++;
    if (lotSize.min || lotSize.max) count++;
    if (hasPhotos !== null) count++;
    if (limit !== "50") count++;
    return count;
  }, [
    propertyType,
    priceRange,
    bedrooms,
    bathrooms,
    searchQuery,
    notifyFor,
    squareFootage,
    lotSize,
    hasPhotos,
    limit,
  ]);

  const formatPrice = (price: string) => {
    if (!price) return "";
    const num = parseInt(price.replace(/[^0-9]/g, ""));
    if (isNaN(num)) return price;
    return `$${num.toLocaleString()}`;
  };

  const formatNumber = (num: string) => {
    if (!num) return "";
    const value = parseInt(num.replace(/[^0-9]/g, ""));
    if (isNaN(value)) return num;
    return value.toLocaleString();
  };

  /* ── API ── */
  const fetchFilteredProperties = async () => {
    if (!onPropertiesUpdate) return;

    try {
      setIsLoading(true);
      setTestResult("");

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

      if (lotSize.min) {
        const lotMin = parseInt(lotSize.min.replace(/[^0-9]/g, ""));
        if (!isNaN(lotMin) && lotMin > 0) filters.lot_size_min = lotMin;
      }

      const limitValue = parseInt(limit);

      console.log("Fetching exclusive properties with filters:", filters);

      const response = await fetchExclusiveProperties(filters);

      let limitedResults = response.results || [];
      if (!isNaN(limitValue) && limitValue > 0) {
        limitedResults = limitedResults.slice(0, limitValue);
      }

      const filterDescriptions = [];
      if (propertyType.length > 0) {
        const typeNames = propertyType.map(
          (type) =>
            availablePropertyTypes.find(
              (t) => t.toLowerCase().replace(" ", "-") === type,
            ) || type,
        );
        filterDescriptions.push(typeNames.join(", "));
      }
      if (searchQuery.trim())
        filterDescriptions.push(`City: ${searchQuery.trim()}`);
      if (priceRange.min || priceRange.max) {
        const min = priceRange.min
          ? `$${parseInt(priceRange.min.replace(/[^0-9]/g, "")).toLocaleString()}`
          : "Any";
        const max = priceRange.max
          ? `$${parseInt(priceRange.max.replace(/[^0-9]/g, "")).toLocaleString()}`
          : "Any";
        filterDescriptions.push(`Price: ${min} - ${max}`);
      }
      if (hasPhotos !== null)
        filterDescriptions.push(hasPhotos ? "Has Photos" : "No Photos");
      if (bedrooms !== "all") filterDescriptions.push(`${bedrooms} bedrooms`);
      if (bathrooms !== "all")
        filterDescriptions.push(`${bathrooms} bathrooms`);
      if (notifyFor !== "all")
        filterDescriptions.push(notifyFor.replace("-", " "));
      if (squareFootage.min || squareFootage.max) {
        const min = squareFootage.min
          ? `${parseInt(squareFootage.min.replace(/[^0-9]/g, "")).toLocaleString()} sqft`
          : "Any";
        const max = squareFootage.max
          ? `${parseInt(squareFootage.max.replace(/[^0-9]/g, "")).toLocaleString()} sqft`
          : "Any";
        filterDescriptions.push(`Square footage: ${min} - ${max}`);
      }
      if (lotSize.min || lotSize.max) {
        const min = lotSize.min
          ? `${parseInt(lotSize.min.replace(/[^0-9]/g, "")).toLocaleString()} sqft lot`
          : "Any";
        const max = lotSize.max
          ? `${parseInt(lotSize.max.replace(/[^0-9]/g, "")).toLocaleString()} sqft lot`
          : "Any";
        filterDescriptions.push(`Lot size: ${min} - ${max}`);
      }
      if (limit !== "50") filterDescriptions.push(`Limit: ${limit}`);

      const query =
        filterDescriptions.length > 0
          ? `Exclusive Properties (${filterDescriptions.join(", ")})`
          : "All Exclusive Properties";

      onPropertiesUpdate(limitedResults, query);
      setActiveFilters(calculateActiveFilters());
    } catch (error) {
      console.error("Error fetching exclusive properties:", error);
      setTestResult("Error fetching properties. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => fetchFilteredProperties();

  const handleClearFilters = () => {
    setSearchQuery("");
    setNotifyFor("all");
    setPropertyType([]);
    setPriceRange({ min: "", max: "" });
    setBedrooms("all");
    setBathrooms("all");
    setGarage("all");
    setSquareFootage({ min: "", max: "" });
    setLotSize({ min: "", max: "" });
    setRentalYield({ min: "", max: "" });
    setSchoolScore({ min: "", max: "" });
    setBasement([]);
    setOpenHouse("unspecified");
    setListingType("all");
    setHasPhotos(null);
    setLimit("50");
    setActiveFilters(0);
    setTestResult("");
  };

  const activeCount = calculateActiveFilters();

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  return (
    <div
      className="w-full max-h-[calc(100vh-12rem)] flex flex-col rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "#f8f9fb",
        border: `1px solid ${colors.cardsBoarder}`,
      }}
    >
      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-20 px-4 pt-4 pb-3"
        style={{
          background: "linear-gradient(to bottom, #f8f9fb 80%, #f8f9fb00)",
        }}
      >
        {/* Title row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${colors.primary}12` }}
          >
            <SlidersHorizontal
              className="w-4 h-4"
              style={{ color: colors.primary }}
            />
          </div>
          <div>
            <h2
              className="text-sm font-bold leading-tight"
              style={{ color: colors.heading }}
            >
              Filters
            </h2>
            <p className="text-[11px]" style={{ color: colors.body }}>
              {activeCount > 0
                ? `${activeCount} filter${activeCount !== 1 ? "s" : ""} active`
                : "Refine your search"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold
              transition-all duration-250 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
            style={{
              backgroundColor: colors.primary,
              color: "#ffffff",
              boxShadow: `0 4px 14px ${colors.primary}35`,
            }}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Apply Filters
                {activeCount > 0 && (
                  <span
                    className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    {activeCount}
                  </span>
                )}
              </>
            )}
          </button>

          <button
            onClick={handleClearFilters}
            disabled={isLoading}
            className="h-10 px-3 rounded-xl text-[13px] font-medium
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-black/[0.04] active:scale-[0.97]"
            style={{
              color: colors.body,
              border: `1.5px solid ${colors.cardsBoarder}`,
              backgroundColor: colors.cards,
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div
        className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: `${colors.cardsBoarder} transparent`,
          overscrollBehavior: "contain",
        }}
      >
        {/* Results Limit */}
        <FilterSection
          title="Results Limit"
          icon={SlidersHorizontal}
          defaultOpen={true}
        >
          <div className="grid grid-cols-4 gap-2 mt-2">
            {["10", "25", "50", "100"].map((option) => (
              <PillButton
                key={option}
                selected={limit === option}
                onClick={() => setLimit(option)}
                disabled={isLoading}
                fullWidth
              >
                {option}
              </PillButton>
            ))}
          </div>
        </FilterSection>

        {/* Property Type */}
        <FilterSection
          title="Property Type"
          icon={Home}
          defaultOpen={true}
          badge={propertyType.length > 0 ? propertyType.length : undefined}
        >
          {/* Select All / Clear */}
          <div className="flex items-center justify-end gap-3 mt-1 mb-1">
            <button
              onClick={selectAllPropertyTypes}
              disabled={isLoading}
              className="text-[11px] font-semibold transition-colors hover:underline"
              style={{ color: colors.primary }}
            >
              Select All
            </button>
            <button
              onClick={clearPropertyTypes}
              disabled={isLoading}
              className="text-[11px] font-semibold transition-colors hover:underline"
              style={{ color: colors.body }}
            >
              Clear
            </button>
          </div>

          <div className="space-y-0.5">
            {availablePropertyTypes.map((option) => {
              const formattedOption = option.toLowerCase().replace(" ", "-");
              return (
                <StyledCheckbox
                  key={option}
                  checked={propertyType.includes(formattedOption)}
                  onChange={() => togglePropertyType(option)}
                  label={option}
                  disabled={isLoading}
                />
              );
            })}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" icon={DollarSign}>
          <div className="flex gap-3 mt-2 mb-3">
            <FilterInput
              label="Min"
              placeholder="0"
              value={formatPrice(priceRange.min)}
              onChange={(val) => setPriceRange({ ...priceRange, min: val })}
              prefix="$"
              disabled={isLoading}
            />
            <FilterInput
              label="Max"
              placeholder="5,000,000"
              value={formatPrice(priceRange.max)}
              onChange={(val) => setPriceRange({ ...priceRange, max: val })}
              prefix="$"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "$20+", value: "20" },
              { label: "$100K+", value: "100000" },
              { label: "$500K+", value: "500000" },
              { label: "$1M+", value: "1000000" },
            ].map(({ label, value }) => (
              <PillButton
                key={label}
                selected={priceRange.min === value}
                onClick={() => setPriceRange({ min: value, max: "" })}
                disabled={isLoading}
                fullWidth
              >
                {label}
              </PillButton>
            ))}
          </div>
        </FilterSection>

        {/* Bedrooms */}
        <FilterSection title="Bedrooms" icon={BedDouble}>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {["All", "1+", "2+", "3+", "4+", "5+"].map((option) => (
              <PillButton
                key={option}
                selected={bedrooms === option.toLowerCase()}
                onClick={() => setBedrooms(option.toLowerCase())}
                disabled={isLoading}
                fullWidth
              >
                {option}
              </PillButton>
            ))}
          </div>
        </FilterSection>

        {/* Bathrooms */}
        <FilterSection title="Bathrooms" icon={Bath}>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {["All", "1+", "2+", "3+", "4+"].map((option) => (
              <PillButton
                key={option}
                selected={bathrooms === option.toLowerCase()}
                onClick={() => setBathrooms(option.toLowerCase())}
                disabled={isLoading}
                fullWidth
              >
                {option}
              </PillButton>
            ))}
          </div>
        </FilterSection>

        {/* Square Footage */}
        <FilterSection title="Square Footage" icon={Maximize2}>
          <div className="flex gap-3 mt-2 mb-3">
            <FilterInput
              label="Min"
              placeholder="1,000"
              value={formatNumber(squareFootage.min)}
              onChange={(val) =>
                setSquareFootage({ ...squareFootage, min: val })
              }
              suffix="sqft"
              disabled={isLoading}
            />
            <FilterInput
              label="Max"
              placeholder="5,000"
              value={formatNumber(squareFootage.max)}
              onChange={(val) =>
                setSquareFootage({ ...squareFootage, max: val })
              }
              suffix="sqft"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "1,000+ sqft", value: "1000" },
              { label: "1,500+ sqft", value: "1500" },
              { label: "2,000+ sqft", value: "2000" },
              { label: "2,500+ sqft", value: "2500" },
            ].map(({ label, value }) => (
              <PillButton
                key={label}
                selected={squareFootage.min === value}
                onClick={() => setSquareFootage({ min: value, max: "" })}
                disabled={isLoading}
                fullWidth
              >
                {label}
              </PillButton>
            ))}
          </div>
        </FilterSection>

        {/* Lot Size */}
        <FilterSection title="Lot Size" icon={LandPlot}>
          <div className="flex gap-3 mt-2">
            <FilterInput
              label="Min"
              placeholder="5,000"
              value={formatNumber(lotSize.min)}
              onChange={(val) => setLotSize({ ...lotSize, min: val })}
              suffix="sqft"
              disabled={isLoading}
            />
            <FilterInput
              label="Max"
              placeholder="20,000"
              value={formatNumber(lotSize.max)}
              onChange={(val) => setLotSize({ ...lotSize, max: val })}
              suffix="sqft"
              disabled={isLoading}
            />
          </div>
        </FilterSection>
      </div>
    </div>
  );
}
