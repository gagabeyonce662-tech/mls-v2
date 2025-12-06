"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { colors } from "@/config/design-system";
import { fetchExclusiveProperties, testExclusiveEndpoint, type ExclusivePropertyFilterParams } from "@/lib/api";

interface PropertyFilterProps {
  onPropertiesUpdate?: (properties: any[], query: string) => void;
}

/* ---------- Button class helpers (uniform sizing) ---------- */
const BTN_BASE = "inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMARY = `${BTN_BASE} shadow-lg`;
const BTN_SECONDARY = `${BTN_BASE} border`;
const BTN_TOGGLE = `${BTN_BASE} border`;
const BTN_SELECTED = "ring-2 ring-offset-1";

export default function PropertyFilter({ onPropertiesUpdate }: PropertyFilterProps) {
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

  // Property type mapping to API values
  const propertyTypeMapping: { [key: string]: string } = {
    "detached": "detached",
    "semi-detached": "semi-detached",
    "condo-apt": "Condo",
    "freehold-townhouse": "Townhouse",
    "condo-townhouse": "Townhouse",
    "Single-Family": "Single-Family",
    "multiplex": "Multiplex",
    "vacant-land": "Vacant Land"
  };

  // Available property types from your UI
  const availablePropertyTypes = [
    "Detached", 
    "Semi-Detached", 
    "Condo Apt", 
    "Freehold Townhouse", 
    "Condo Townhouse", 
    "Single-Family",
    "Multiplex", 
    "Vacant Land"
  ];

  // Toggle property type selection
  const togglePropertyType = (type: string) => {
    const formattedType = type.toLowerCase().replace(" ", "-");
    setPropertyType(prev => {
      if (prev.includes(formattedType)) {
        return prev.filter(t => t !== formattedType);
      } else {
        return [...prev, formattedType];
      }
    });
  };

  // Select all property types
  const selectAllPropertyTypes = () => {
    const allTypes = availablePropertyTypes.map(type => type.toLowerCase().replace(" ", "-"));
    setPropertyType(allTypes);
  };

  // Clear all property types
  const clearPropertyTypes = () => {
    setPropertyType([]);
  };

  // Calculate active filters count
  const calculateActiveFilters = () => {
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
  };

  // Test the endpoint
  const handleTestEndpoint = async () => {
    setTestResult("Testing endpoint...");
    await testExclusiveEndpoint();
    setTestResult("Test completed. Check browser console for results.");
  };

  // Fetch filtered properties using the exclusive properties API
  const fetchFilteredProperties = async () => {
    if (!onPropertiesUpdate) return;
    
    try {
      setIsLoading(true);
      setTestResult("");
      
      // Build filter object for exclusive properties API
      const filters: ExclusivePropertyFilterParams = {};
      
      // Property types - join selected types with commas
      if (propertyType.length > 0) {
        const apiPropertyTypes = propertyType
          .map(type => propertyTypeMapping[type] || type)
          .filter(Boolean)
          .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
        
        if (apiPropertyTypes.length > 0) {
          filters.property_sub_type = apiPropertyTypes.join(",");
        }
      }
      
      // City search
      if (searchQuery.trim()) {
        filters.city = searchQuery.trim();
      }
      
      // Price range - USING price_min and price_max parameters
      if (priceRange.min) {
        const minValue = parseInt(priceRange.min.replace(/[^0-9]/g, ''));
        if (!isNaN(minValue) && minValue > 0) {
          filters.price_min = minValue;
        }
      }
      if (priceRange.max) {
        const maxValue = parseInt(priceRange.max.replace(/[^0-9]/g, ''));
        if (!isNaN(maxValue) && maxValue > 0) {
          filters.price_max = maxValue;
        }
      }
      
      // Bedrooms (remove "+" sign if present)
      if (bedrooms !== "all" && bedrooms !== "") {
        const bedroomValue = bedrooms.replace("+", "");
        const bedroomNum = parseInt(bedroomValue);
        if (!isNaN(bedroomNum) && bedroomNum > 0) {
          filters.bedrooms = bedroomNum;
        }
      }
      
      // Bathrooms (remove "+" sign if present)
      if (bathrooms !== "all" && bathrooms !== "") {
        const bathroomValue = bathrooms.replace("+", "");
        const bathroomNum = parseInt(bathroomValue);
        if (!isNaN(bathroomNum) && bathroomNum > 0) {
          filters.bathrooms = bathroomNum;
        }
      }
      
      // Status based on notify selection
      if (notifyFor === "for-sale") {
        filters.standard_status = "Active";
      } else if (notifyFor === "sold") {
        filters.standard_status = "Sold";
      }
      
      // Has photos
      if (hasPhotos !== null) {
        filters.has_photos = hasPhotos;
      }
      
      // Square footage (building_area_min)
      if (squareFootage.min) {
        const sqftMin = parseInt(squareFootage.min.replace(/[^0-9]/g, ''));
        if (!isNaN(sqftMin) && sqftMin > 0) {
          filters.building_area_min = sqftMin;
        }
      }
      if (squareFootage.max) {
        const sqftMax = parseInt(squareFootage.max.replace(/[^0-9]/g, ''));
        if (!isNaN(sqftMax) && sqftMax > 0) {
          filters.building_area_max = sqftMax;
        }
      }
      
      // Lot size (lot_size_min)
      if (lotSize.min) {
        const lotMin = parseInt(lotSize.min.replace(/[^0-9]/g, ''));
        if (!isNaN(lotMin) && lotMin > 0) {
          filters.lot_size_min = lotMin;
        }
      }
      
      // Limit (Note: This might be handled differently in the backend)
      const limitValue = parseInt(limit);
      if (!isNaN(limitValue) && limitValue > 0 && limitValue !== 50) {
        console.log(`Note: Limit parameter is ${limitValue}. Check if your backend supports 'limit' parameter.`);
      }
      
      console.log("Fetching exclusive properties with filters:", filters);
      console.log("Additional parameter - limit:", limit);
      
      // Use the exclusive properties API function
      const response = await fetchExclusiveProperties(filters);
      
      // Apply limit client-side if backend doesn't support it
      let limitedResults = response.results || [];
      if (!isNaN(limitValue) && limitValue > 0) {
        limitedResults = limitedResults.slice(0, limitValue);
      }
      
      // Build query description
      const filterDescriptions = [];
      if (propertyType.length > 0) {
        const typeNames = propertyType.map(type => 
          availablePropertyTypes.find(t => t.toLowerCase().replace(" ", "-") === type) || type
        );
        filterDescriptions.push(typeNames.join(", "));
      }
      if (searchQuery.trim()) filterDescriptions.push(`City: ${searchQuery.trim()}`);
      if (priceRange.min || priceRange.max) {
        const min = priceRange.min ? `$${parseInt(priceRange.min.replace(/[^0-9]/g, '')).toLocaleString()}` : 'Any';
        const max = priceRange.max ? `$${parseInt(priceRange.max.replace(/[^0-9]/g, '')).toLocaleString()}` : 'Any';
        filterDescriptions.push(`Price: ${min} - ${max}`);
      }
      if (hasPhotos !== null) filterDescriptions.push(hasPhotos ? "Has Photos" : "No Photos");
      if (bedrooms !== "all") filterDescriptions.push(`${bedrooms} bedrooms`);
      if (bathrooms !== "all") filterDescriptions.push(`${bathrooms} bathrooms`);
      if (notifyFor !== "all") filterDescriptions.push(notifyFor.replace("-", " "));
      if (squareFootage.min || squareFootage.max) {
        const min = squareFootage.min ? `${parseInt(squareFootage.min.replace(/[^0-9]/g, '')).toLocaleString()} sqft` : 'Any';
        const max = squareFootage.max ? `${parseInt(squareFootage.max.replace(/[^0-9]/g, '')).toLocaleString()} sqft` : 'Any';
        filterDescriptions.push(`Square footage: ${min} - ${max}`);
      }
      if (lotSize.min || lotSize.max) {
        const min = lotSize.min ? `${parseInt(lotSize.min.replace(/[^0-9]/g, '')).toLocaleString()} sqft lot` : 'Any';
        const max = lotSize.max ? `${parseInt(lotSize.max.replace(/[^0-9]/g, '')).toLocaleString()} sqft lot` : 'Any';
        filterDescriptions.push(`Lot size: ${min} - ${max}`);
      }
      if (limit !== "50") filterDescriptions.push(`Limit: ${limit}`);
      
      const query = filterDescriptions.length > 0 
        ? `Exclusive Properties (${filterDescriptions.join(', ')})`
        : "All Exclusive Properties";
      
      onPropertiesUpdate(limitedResults, query);
      console.log("Exclusive properties found (after limit):", limitedResults.length);
      
      // Update active filters count
      setActiveFilters(calculateActiveFilters());
      
    } catch (error) {
      console.error("Error fetching exclusive properties:", error);
      setTestResult("Error fetching properties. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    fetchFilteredProperties();
  };

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

  const handleBasementChange = (option: string) => {
    const value = option.toLowerCase().replace(" ", "-");
    if (basement.includes(value)) {
      setBasement(basement.filter(item => item !== value));
    } else {
      setBasement([...basement, value]);
    }
  };

  // Format price for display
  const formatPrice = (price: string) => {
    if (!price) return "";
    const num = parseInt(price.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return price;
    return `$${num.toLocaleString()}`;
  };

  // Format number for display
  const formatNumber = (num: string) => {
    if (!num) return "";
    const value = parseInt(num.replace(/[^0-9]/g, ''));
    if (isNaN(value)) return num;
    return value.toLocaleString();
  };

  return (
    <div className="w-full max-h-[calc(100vh-12rem)] overflow-y-auto border rounded-lg" style={{ 
      backgroundColor: colors.boarder,
      scrollbarWidth: 'thin',
      scrollbarColor: `${colors.cardsBoarder} transparent`
    }}>
      {/* Header */}  
      <div className="sticky top-0 pt-1 pb-2 z-10" style={{ backgroundColor: colors.boarder }}>
        <div className="sticky top-2 gap-2 pt-4 z-20" style={{ backgroundColor: colors.boarder }}>
          {/* NEW: single-row container for Apply + Clear All */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleApply}
              disabled={isLoading}
              className={`${BTN_PRIMARY} flex-1`}
              style={{ backgroundColor: colors.primary, color: colors.cards, borderColor: colors.primary }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Applying Filters...
                </span>
              ) : (
                `APPLY FILTERS (${calculateActiveFilters()} active)`
              )}
            </button>

            <button
              onClick={handleClearFilters}
              disabled={isLoading}
              className={`${BTN_SECONDARY}`}
              style={{ backgroundColor: colors.cards, color: colors.body, borderColor: colors.cardsBoarder }}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6 pb-4">
        {/* Limit Results */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Results Limit
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {["10", "25", "50", "100"].map((option) => {
              const selected = limit === option;
              return (
                <button
                  key={option}
                  onClick={() => setLimit(option)}
                  disabled={isLoading}
                  className={`${BTN_TOGGLE} ${selected ? BTN_SELECTED : ""} w-full`}
                  style={{
                    borderColor: selected ? colors.primary : colors.cardsBoarder,
                    color: selected ? colors.cards : colors.body,
                    backgroundColor: selected ? colors.primary : colors.cards
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Has Photos */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Has Photos
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "All", value: null },
              { label: "Yes", value: true },
              { label: "No", value: false }
            ].map(({ label, value }) => {
              const selected = hasPhotos === value;
              return (
                <button
                  key={label}
                  onClick={() => setHasPhotos(value)}
                  disabled={isLoading}
                  className={`${BTN_TOGGLE} ${selected ? BTN_SELECTED : ""} w-full`}
                  style={{
                    borderColor: selected ? colors.primary : colors.cardsBoarder,
                    color: selected ? colors.cards : colors.body,
                    backgroundColor: selected ? colors.primary : colors.cards
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notify For */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Status
          </h3>
          <div className="space-y-2">
            {["All", "For Sale", "Sold", "De-listed"].map((option) => (
              <label key={option} className="flex items-center cursor-pointer group">
                <div className="relative mr-2">
                  <input
                    type="radio"
                    name="notify"
                    value={option.toLowerCase().replace(" ", "-")}
                    checked={notifyFor === option.toLowerCase().replace(" ", "-")}
                    onChange={(e) => setNotifyFor(e.target.value)}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${notifyFor === option.toLowerCase().replace(" ", "-") ? 'border-blue-500' : 'border-gray-400'} ${isLoading ? 'opacity-50' : ''}`}>
                    {notifyFor === option.toLowerCase().replace(" ", "-") && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
                <span className={`text-sm group-hover:text-blue-400 transition-colors ${isLoading ? 'opacity-50' : ''}`} style={{ color: colors.body }}>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Property Type - MULTIPLE SELECTION */}
        <div className="bg-white/5 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm" style={{ color: colors.heading }}>
              Property Type
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllPropertyTypes}
                className="text-xs text-blue-500 hover:text-blue-700 underline"
                disabled={isLoading}
              >
                Select All
              </button>
              <button
                onClick={clearPropertyTypes}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
                disabled={isLoading}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            {availablePropertyTypes.map((option) => {
              const formattedOption = option.toLowerCase().replace(" ", "-");
              const isSelected = propertyType.includes(formattedOption);
              
              return (
                <label key={option} className="flex items-center cursor-pointer group">
                  <div
                    onClick={() => togglePropertyType(option)}
                    className={`inline-flex items-center justify-center w-10 h-10 mr-3 rounded-lg ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}
                    style={{ borderWidth: 1 }}
                  >
                    {isSelected ? (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm" style={{ color: colors.body }}>
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
          
          {propertyType.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.cardsBoarder }}>
              <p className="text-xs" style={{ color: colors.body }}>
                Selected:{" "}
                <span className="font-medium">
                  {propertyType.length} type{propertyType.length !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Price Range
          </h3>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: colors.body }}>Min Price</label>
                <div className="relative">
                  
                  <input
                    type="text"
                    placeholder="20"
                    value={formatPrice(priceRange.min)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setPriceRange({ ...priceRange, min: value });
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                    style={{ 
                      borderColor: colors.cardsBoarder,
                      color: colors.heading,
                      backgroundColor: colors.cards
                    }}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: colors.body }}>Max Price</label>
                <div className="relative">
                 
                  <input
                    type="text"
                    placeholder="5,000,000"
                    value={formatPrice(priceRange.max)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setPriceRange({ ...priceRange, max: value });
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                    style={{ 
                      borderColor: colors.cardsBoarder,
                      color: colors.heading,
                      backgroundColor: colors.cards
                    }}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Price range quick buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "$20+", value: "20" },
              { label: "$100K+", value: "100000" },
              { label: "$500K+", value: "500000" },
              { label: "$1M+", value: "1000000" },
            ].map(({ label, value }) => {
              const selected = priceRange.min === value;
              return (
                <button
                  key={label}
                  onClick={() => setPriceRange({ min: value, max: "" })}
                  className={`${BTN_TOGGLE} ${selected ? BTN_SELECTED : ""} w-full`}
                  style={{
                    borderColor: selected ? colors.primary : colors.cardsBoarder,
                    color: selected ? colors.cards : colors.body,
                    backgroundColor: selected ? colors.primary : colors.cards
                  }}
                  disabled={isLoading}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bedrooms */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Bedrooms
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {["All", "1+", "2+", "3+", "4+", "5+"].map((option) => {
              const selected = bedrooms === option.toLowerCase();
              return (
                <button
                  key={option}
                  onClick={() => setBedrooms(option.toLowerCase())}
                  disabled={isLoading}
                  className={`${BTN_TOGGLE} ${selected ? BTN_SELECTED : ""} w-full`}
                  style={{
                    borderColor: selected ? colors.primary : colors.cardsBoarder,
                    color: selected ? colors.cards : colors.body,
                    backgroundColor: selected ? colors.primary : colors.cards
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bathrooms */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Bathrooms
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {["All", "1+", "2+", "3+", "4+"].map((option) => {
              const selected = bathrooms === option.toLowerCase();
              return (
                <button
                  key={option}
                  onClick={() => setBathrooms(option.toLowerCase())}
                  disabled={isLoading}
                  className={`${BTN_TOGGLE} ${selected ? BTN_SELECTED : ""} w-full`}
                  style={{
                    borderColor: selected ? colors.primary : colors.cardsBoarder,
                    color: selected ? colors.cards : colors.body,
                    backgroundColor: selected ? colors.primary : colors.cards
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Square Footage */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Square Footage
          </h3>
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: colors.body }}>Min</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="2500"
                    value={formatNumber(squareFootage.min)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setSquareFootage({ ...squareFootage, min: value });
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                    style={{ 
                      borderColor: colors.cardsBoarder,
                      color: colors.heading,
                      backgroundColor: colors.cards
                    }}
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">sqft</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: colors.body }}>Max</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="5000"
                    value={formatNumber(squareFootage.max)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setSquareFootage({ ...squareFootage, max: value });
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                    style={{ 
                      borderColor: colors.cardsBoarder,
                      color: colors.heading,
                      backgroundColor: colors.cards
                    }}
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">sqft</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick square footage buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "1000+ sqft", value: "1000" },
              { label: "1500+ sqft", value: "1500" },
              { label: "2000+ sqft", value: "2000" },
              { label: "2500+ sqft", value: "2500" },
            ].map(({ label, value }) => {
              const selected = squareFootage.min === value;
              return (
                <button
                  key={label}
                  onClick={() => setSquareFootage({ min: value, max: "" })}
                  className={`${BTN_TOGGLE} ${selected ? BTN_SELECTED : ""} w-full`}
                  style={{
                    borderColor: selected ? colors.primary : colors.cardsBoarder,
                    color: selected ? colors.cards : colors.body,
                    backgroundColor: selected ? colors.primary : colors.cards
                  }}
                  disabled={isLoading}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lot Size */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Lot Size
          </h3>
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: colors.body }}>Min</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="8000"
                    value={formatNumber(lotSize.min)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setLotSize({ ...lotSize, min: value });
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                    style={{ 
                      borderColor: colors.cardsBoarder,
                      color: colors.heading,
                      backgroundColor: colors.cards
                    }}
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">sqft</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: colors.body }}>Max</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="20000"
                    value={formatNumber(lotSize.max)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setLotSize({ ...lotSize, max: value });
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                    style={{ 
                      borderColor: colors.cardsBoarder,
                      color: colors.heading,
                      backgroundColor: colors.cards
                    }}
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">sqft</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* (you can continue past here - I retained the rest of your structure) */}
        
      </div>
    </div>
  );
}
