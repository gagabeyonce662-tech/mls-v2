"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { colors } from "@/config/design-system";
import { useProvinceProperties } from "@/hooks/useProvinceProperties";
import { type PropertyFilterParams } from "@/lib/api";

interface PropertyFilterProps {
  onPropertiesUpdate?: (properties: any[], query: string) => void;
}

export default function PropertyFilter({ onPropertiesUpdate }: PropertyFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifyFor, setNotifyFor] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "20", max: "999100000" });
  const [bedrooms, setBedrooms] = useState("all");
  const [bathrooms, setBathrooms] = useState("all");
  const [garage, setGarage] = useState("all");
  const [squareFootage, setSquareFootage] = useState({ min: "", max: "" });
  const [lotFront, setLotFront] = useState({ min: "", max: "" });
  const [rentalYield, setRentalYield] = useState({ min: "", max: "" });
  const [schoolScore, setSchoolScore] = useState({ min: "", max: "" });
  const [basement, setBasement] = useState<string[]>([]);
  const [openHouse, setOpenHouse] = useState("unspecified");
  const [listingType, setListingType] = useState("all");
  const { fetchProvinceProperties, provinceName } = useProvinceProperties();

  const handleApply = async () => {
    console.log("Applying filters for province:", provinceName);
    
    if (!onPropertiesUpdate) return;
    
    try {
      // Build filter object
      const filters: PropertyFilterParams = {};
      
      // Price range
      if (priceRange.min !== "20") {
        filters.price_min = parseInt(priceRange.min);
      }
      if (priceRange.max !== "999100000") {
        filters.price_max = parseInt(priceRange.max);
      }
      
      // Bedrooms
      if (bedrooms !== "all") {
        const bedroomCount = bedrooms.replace("+", "");
        filters.bedrooms = parseInt(bedroomCount);
      }
      
      // Bathrooms  
      if (bathrooms !== "all") {
        const bathroomCount = bathrooms.replace("+", "");
        filters.bathrooms = parseInt(bathroomCount);
      }
      
      // Property type mapping
      if (propertyType !== "all") {
        const typeMapping: { [key: string]: string } = {
          "detached": "Single Family Attached",
          "semi-detached": "Single Family Detached", 
          "condo-apt": "Condominium",
          "freehold-townhouse": "Townhouse",
          "condo-townhouse": "Townhouse"
        };
        filters.property_subtype = typeMapping[propertyType] || propertyType;
      }
      
      // Status based on notify selection
      if (notifyFor === "for-sale") {
        filters.status = "Active";
      } else if (notifyFor === "sold") {
        filters.status = "Sold";
      }
      
      // City search
      if (searchQuery.trim()) {
        filters.city = searchQuery.trim();
      }
      
      console.log("Applying filters:", filters);
      const filteredProperties = await fetchProvinceProperties(filters);
      onPropertiesUpdate(filteredProperties, `${provinceName} - Filtered Results`);
      console.log("Filter results:", filteredProperties.length, "properties found");
      
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  const handleBasementChange = (option: string) => {
    const value = option.toLowerCase().replace(" ", "-");
    if (basement.includes(value)) {
      setBasement(basement.filter(item => item !== value));
    } else {
      setBasement([...basement, value]);
    }
  };

  return (
    <div className="w-full p-4 max-h-[calc(100vh-12rem)] overflow-y-auto border rounded-lg" style={{ 
      backgroundColor: colors.boarder,
      scrollbarWidth: 'thin',
      scrollbarColor: `${colors.cardsBoarder} transparent`
    }}>
      {/* Header */}
      <div className="sticky top-0 pt-1 pb-2 z-10" style={{ backgroundColor: colors.boarder }}>
        <h2 className="text-lg font-bold mb-2" style={{ color: colors.heading }}>
          Find your Home
        </h2>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.body }} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1"
              style={{ 
                borderColor: colors.cardsBoarder,
                color: colors.heading,
                backgroundColor: colors.cards,
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6 pb-4">
        {/* Notify For */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Notify For
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
                  />
                  <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${notifyFor === option.toLowerCase().replace(" ", "-") ? 'border-blue-500' : 'border-gray-400'}`}>
                    {notifyFor === option.toLowerCase().replace(" ", "-") && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
                <span className="text-sm group-hover:text-blue-400 transition-colors" style={{ color: colors.body }}>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Property Type
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            {[
              "All", "Link", "Multiplex", "Detached", "Condo Apt", 
              "Vacant Land", "Semi-Detached", "Condo Townhouse", 
              "Freehold Townhouse", "Others"
            ].map((option) => (
              <label key={option} className="flex items-center cursor-pointer group">
                <div className="relative mr-2">
                  <input
                    type="radio"
                    name="propertyType"
                    value={option.toLowerCase().replace(" ", "-")}
                    checked={propertyType === option.toLowerCase().replace(" ", "-")}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${propertyType === option.toLowerCase().replace(" ", "-") ? 'border-blue-500' : 'border-gray-400'}`}>
                    {propertyType === option.toLowerCase().replace(" ", "-") && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
                <span className="text-sm group-hover:text-blue-400 transition-colors" style={{ color: colors.body }}>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Price Range
          </h3>
          <div className="mb-4 px-1">
            <input
              type="range"
              min="20"
              max="99910000"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{ 
                backgroundColor: colors.cardsBoarder,
                accentColor: colors.primary
              }}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Min</label>
              <input
                type="text"
                placeholder="$20"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Max</label>
              <input
                type="text"
                placeholder="$99,910,000"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Bedrooms
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {["All", "1+", "2+", "3+", "4+", "5+"].map((option) => (
              <button
                key={option}
                onClick={() => setBedrooms(option.toLowerCase())}
                className="px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: bedrooms === option.toLowerCase() ? colors.primary : colors.cardsBoarder,
                  color: bedrooms === option.toLowerCase() ? colors.cards : colors.body,
                  backgroundColor: bedrooms === option.toLowerCase() ? colors.primary : colors.cards
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Bathrooms */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Bathrooms
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {["All", "1+", "2+", "3+", "4+"].map((option) => (
              <button
                key={option}
                onClick={() => setBathrooms(option.toLowerCase())}
                className="px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: bathrooms === option.toLowerCase() ? colors.primary : colors.cardsBoarder,
                  color: bathrooms === option.toLowerCase() ? colors.cards : colors.body,
                  backgroundColor: bathrooms === option.toLowerCase() ? colors.primary : colors.cards
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Garage */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Garage
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {["All", "1+", "2+", "3+", "4+"].map((option) => (
              <button
                key={option}
                onClick={() => setGarage(option.toLowerCase())}
                className="px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: garage === option.toLowerCase() ? colors.primary : colors.cardsBoarder,
                  color: garage === option.toLowerCase() ? colors.cards : colors.body,
                  backgroundColor: garage === option.toLowerCase() ? colors.primary : colors.cards
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Square Footage */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Square Footage
          </h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Min</label>
              <input
                type="text"
                placeholder="Min."
                value={squareFootage.min}
                onChange={(e) => setSquareFootage({ ...squareFootage, min: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Max</label>
              <input
                type="text"
                placeholder="Max."
                value={squareFootage.max}
                onChange={(e) => setSquareFootage({ ...squareFootage, max: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
          </div>
        </div>

        {/* Lot Front */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Lot Front
          </h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Min</label>
              <input
                type="text"
                placeholder="Min."
                value={lotFront.min}
                onChange={(e) => setLotFront({ ...lotFront, min: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Max</label>
              <input
                type="text"
                placeholder="Max."
                value={lotFront.max}
                onChange={(e) => setLotFront({ ...lotFront, max: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
          </div>
        </div>

        {/* Rental Yield */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Rental Yield
          </h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Min</label>
              <input
                type="text"
                placeholder="Min."
                value={rentalYield.min}
                onChange={(e) => setRentalYield({ ...rentalYield, min: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Max</label>
              <input
                type="text"
                placeholder="Max."
                value={rentalYield.max}
                onChange={(e) => setRentalYield({ ...rentalYield, max: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
          </div>
        </div>

        {/* School Score */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            School Score
          </h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Min</label>
              <input
                type="text"
                placeholder="Min."
                value={schoolScore.min}
                onChange={(e) => setSchoolScore({ ...schoolScore, min: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: colors.body }}>Max</label>
              <input
                type="text"
                placeholder="Max."
                value={schoolScore.max}
                onChange={(e) => setSchoolScore({ ...schoolScore, max: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 text-sm"
                style={{ 
                  borderColor: colors.cardsBoarder,
                  color: colors.heading,
                  backgroundColor: colors.cards
                }}
              />
            </div>
          </div>
        </div>

        {/* Basement */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Basement
          </h3>
          <div className="space-y-2">
            {["Finished", "Separate Entrance", "Walk-out"].map((option) => {
              const value = option.toLowerCase().replace(" ", "-");
              return (
                <label key={option} className="flex items-center cursor-pointer group">
                  <div className="relative mr-2">
                    <input
                      type="checkbox"
                      checked={basement.includes(value)}
                      onChange={() => handleBasementChange(option)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${basement.includes(value) ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                      {basement.includes(value) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm group-hover:text-blue-400 transition-colors" style={{ color: colors.body }}>{option}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Open House */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Open House
          </h3>
          <div className="space-y-2">
            {["Unspecified", "Today", "Tomorrow", "7 Days", "All Open Houses"].map((option) => (
              <label key={option} className="flex items-center cursor-pointer group">
                <div className="relative mr-2">
                  <input
                    type="radio"
                    name="openHouse"
                    value={option.toLowerCase().replace(" ", "-")}
                    checked={openHouse === option.toLowerCase().replace(" ", "-")}
                    onChange={(e) => setOpenHouse(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${openHouse === option.toLowerCase().replace(" ", "-") ? 'border-blue-500' : 'border-gray-400'}`}>
                    {openHouse === option.toLowerCase().replace(" ", "-") && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
                <span className="text-sm group-hover:text-blue-400 transition-colors" style={{ color: colors.body }}>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Listing Type */}
        <div className="bg-white/5 p-3 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.heading }}>
            Listing Type
          </h3>
          <div className="space-y-2">
            {["All", "Resale", "Excl. Assignment"].map((option) => (
              <label key={option} className="flex items-center cursor-pointer group">
                <div className="relative mr-2">
                  <input
                    type="radio"
                    name="listingType"
                    value={option.toLowerCase().replace(" ", "-").replace(".", "")}
                    checked={listingType === option.toLowerCase().replace(" ", "-").replace(".", "")}
                    onChange={(e) => setListingType(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${listingType === option.toLowerCase().replace(" ", "-").replace(".", "") ? 'border-blue-500' : 'border-gray-400'}`}>
                    {listingType === option.toLowerCase().replace(" ", "-").replace(".", "") && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
                <span className="text-sm group-hover:text-blue-400 transition-colors" style={{ color: colors.body }}>{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Button - Sticky at bottom */}
      <div className="sticky bottom-0 pt-4" style={{ backgroundColor: colors.boarder }}>
        <button
          onClick={handleApply}
          className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-lg"
          style={{ backgroundColor: colors.primary }}
        >
          APPLY
        </button>
      </div>
    </div>
  );
}