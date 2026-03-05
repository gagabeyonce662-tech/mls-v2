"use client";

import { useState, useCallback } from "react";
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
  testExclusiveEndpoint,
  type ExclusivePropertyFilterParams,
} from "@/lib/api";

/* ================================================================== */
/*  Types & Props                                                     */
/* ================================================================== */
interface PropertyFilterProps {
  onPropertiesUpdate?: (properties: any[], query: string) => void;
  variant?: "sidebar" | "horizontal";
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
  variant = "sidebar",
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
  const [showMore, setShowMore] = useState(false);

  if (variant === "horizontal") {
    return (
      <div
        className="w-full relative z-30 overflow-hidden rounded-xl transition-all duration-500"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a2f5a 100%)' }}
      >
        {/* Subtle decorative gradient orb */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />

        <div className="relative p-4 lg:p-5">
          <div className="flex flex-col lg:flex-row items-end gap-3">
            {/* Location */}
            <div className="w-full lg:w-1/5">
              <label className="block text-[9px] font-semibold mb-1.5 uppercase tracking-widest text-white/40">Location</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  placeholder="City (e.g. Toronto)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white placeholder:text-white/25 focus:bg-white/[0.12] focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Property Type */}
            <div className="w-full lg:w-1/5">
              <label className="block text-[9px] font-semibold mb-1.5 uppercase tracking-widest text-white/40">Type</label>
              <div className="relative">
                <LandPlot className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none z-10" />
                <select
                  multiple
                  value={propertyType}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setPropertyType(options);
                  }}
                  className="w-full py-2.5 pl-9 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white focus:bg-white/[0.12] focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200 appearance-none min-h-[38px] cursor-pointer"
                  size={1}
                  onFocus={(e) => { e.target.size = 5; e.target.style.background = 'rgba(255,255,255,0.15)'; }}
                  onBlur={(e) => { e.target.size = 1; e.target.style.background = ''; }}
                  onChangeCapture={(e: any) => e.target.size = 1}
                >
                  {availablePropertyTypes.map(type => (
                    <option key={type} value={type.toLowerCase().replace(" ", "-")} className="bg-[#1a2f5a] text-white py-1">{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="w-full lg:w-1/4 flex gap-2">
              <div className="flex-1">
                <label className="block text-[9px] font-semibold mb-1.5 uppercase tracking-widest text-white/40">Min Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    placeholder="0"
                    value={formatPrice(priceRange.min)}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value.replace(/[^0-9]/g, "") })}
                    className="w-full py-2.5 pl-9 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white placeholder:text-white/25 focus:bg-white/[0.12] focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-semibold mb-1.5 uppercase tracking-widest text-white/40">Max Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    placeholder="Any"
                    value={formatPrice(priceRange.max)}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value.replace(/[^0-9]/g, "") })}
                    className="w-full py-2.5 pl-9 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white placeholder:text-white/25 focus:bg-white/[0.12] focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Beds & Baths */}
            <div className="w-full lg:w-1/6 flex gap-2">
              <div className="flex-1">
                <label className="block text-[9px] font-semibold mb-1.5 uppercase tracking-widest text-white/40">Beds</label>
                <div className="relative">
                  <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full py-2.5 pl-9 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white focus:bg-white/[0.12] focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200 cursor-pointer appearance-none"
                  >
                    <option value="all" className="bg-[#1a2f5a] text-white">Any</option>
                    <option value="1+" className="bg-[#1a2f5a] text-white">1+</option>
                    <option value="2+" className="bg-[#1a2f5a] text-white">2+</option>
                    <option value="3+" className="bg-[#1a2f5a] text-white">3+</option>
                    <option value="4+" className="bg-[#1a2f5a] text-white">4+</option>
                    <option value="5+" className="bg-[#1a2f5a] text-white">5+</option>
                  </select>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-semibold mb-1.5 uppercase tracking-widest text-white/40">Baths</label>
                <div className="relative">
                  <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full py-2.5 pl-9 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white focus:bg-white/[0.12] focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200 cursor-pointer appearance-none"
                  >
                    <option value="all" className="bg-[#1a2f5a] text-white">Any</option>
                    <option value="1+" className="bg-[#1a2f5a] text-white">1+</option>
                    <option value="2+" className="bg-[#1a2f5a] text-white">2+</option>
                    <option value="3+" className="bg-[#1a2f5a] text-white">3+</option>
                    <option value="4+" className="bg-[#1a2f5a] text-white">4+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full lg:w-auto flex items-center gap-2">
              <button
                onClick={handleApply}
                disabled={isLoading}
                className="flex-1 lg:flex-none h-[38px] px-8 rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 text-white"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 20px rgba(59,130,246,0.3), 0 4px 12px rgba(37,99,235,0.25)' }}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Search
                  </>
                )}
              </button>
              <button
                onClick={() => setShowMore(!showMore)}
                className={`h-[38px] px-4 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0 ${showMore ? 'bg-white/15 border border-white/25 text-white' : 'border border-white/[0.12] text-white/50 hover:bg-white/10 hover:text-white/80 hover:border-white/25'
                  }`}
              >
                <SlidersHorizontal className={`w-3.5 h-3.5 transition-transform duration-500 ${showMore ? 'rotate-180' : ''}`} />
                {showMore ? "Less" : "Advanced"}
              </button>
              <button
                onClick={handleClearFilters}
                title="Reset all filters"
                className="h-[38px] w-[38px] rounded-lg border border-white/[0.12] text-white/40 hover:bg-white/10 hover:text-red-400 hover:border-red-400/30 transition-all duration-200 flex items-center justify-center group flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-120deg] transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showMore && (
            <div className="mt-4 pt-4 border-t border-white/[0.08] animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                {/* Square Footage */}
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-white/40">Living Space</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                      <input type="text" placeholder="Min sqft" value={formatNumber(squareFootage.min)} onChange={(e) => setSquareFootage({ ...squareFootage, min: e.target.value.replace(/[^0-9]/g, "") })} className="w-full py-2 pl-8 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white placeholder:text-white/25 focus:bg-white/[0.12] focus:border-white/30 outline-none transition-all" />
                    </div>
                    <div className="flex-1 relative">
                      <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                      <input type="text" placeholder="Max sqft" value={formatNumber(squareFootage.max)} onChange={(e) => setSquareFootage({ ...squareFootage, max: e.target.value.replace(/[^0-9]/g, "") })} className="w-full py-2 pl-8 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white placeholder:text-white/25 focus:bg-white/[0.12] focus:border-white/30 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Lot Size */}
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-white/40">Lot Size</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <LandPlot className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                      <input type="text" placeholder="Min sqft" value={formatNumber(lotSize.min)} onChange={(e) => setLotSize({ ...lotSize, min: e.target.value.replace(/[^0-9]/g, "") })} className="w-full py-2 pl-8 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white placeholder:text-white/25 focus:bg-white/[0.12] focus:border-white/30 outline-none transition-all" />
                    </div>
                    <div className="flex-1 relative">
                      <LandPlot className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                      <input type="text" placeholder="Max sqft" value={formatNumber(lotSize.max)} onChange={(e) => setLotSize({ ...lotSize, max: e.target.value.replace(/[^0-9]/g, "") })} className="w-full py-2 pl-8 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white placeholder:text-white/25 focus:bg-white/[0.12] focus:border-white/30 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Results Limit */}
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-white/40">Results</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-3 bg-white/[0.07] border border-white/[0.12] rounded-lg text-xs font-medium text-white focus:bg-white/[0.12] focus:border-white/30 outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="10" className="bg-[#1a2f5a] text-white">10 properties</option>
                    <option value="25" className="bg-[#1a2f5a] text-white">25 properties</option>
                    <option value="50" className="bg-[#1a2f5a] text-white">50 properties</option>
                    <option value="100" className="bg-[#1a2f5a] text-white">100 properties</option>
                  </select>
                </div>

                {/* Reset */}
                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    className="w-full h-[38px] rounded-lg border border-white/[0.12] text-[11px] font-semibold text-white/40 hover:bg-white/10 hover:text-red-400 hover:border-red-400/30 transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-120deg] transition-transform duration-500" />
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
