"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import React, { useState, useEffect, useMemo } from "react";

import {
  useCompareProperties,
  useAllExclusiveProperties,
} from "@/hooks/react-query";
import { useCompare } from "@/contexts/CompareContext";
import {
  X,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface ComparisonProperty {
  id: string;
  image: string;
  price: string;
  address: string;
  municipality: string;
  province: string;
  postalCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  totalRooms: number;
  yearBuilt: number | null;
  garage: string;
  airConditioning: string;
  basement: string;
  zoning: string;
  error?: string;
  rawData?: any;
}

import { Property } from "@/lib/api/types";

function ComparePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    addToCompare,
    removeFromCompare: removeFromGlobalCompare,
    getPropertyKey,
  } = useCompare();

  // Initialize selected IDs from URL - using a lazy initializer for state
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const idsParam = searchParams.get("ids");
      if (idsParam) {
        return decodeURIComponent(idsParam)
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
      }
      const allIds = searchParams.getAll("ids");
      if (allIds.length > 0) {
        return allIds
          .map((id) => decodeURIComponent(id).trim())
          .filter(Boolean);
      }
    } catch (e) {
      console.error("Error parsing initial IDs", e);
    }
    return [];
  });

  const [prevParams, setPrevParams] = useState<string | null>(
    params?.get("ids") || params?.getAll("ids").join(",") || null,
  );

  const idsParam =
    params?.get("ids") || params?.getAll("ids").join(",") || null;
  if (idsParam !== prevParams) {
    setPrevParams(idsParam);
    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((id) => decodeURIComponent(id).trim())
        .filter(Boolean);
      setSelectedIds(ids);
    }
  }

  const [showAddPropertiesModal, setShowAddPropertiesModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debugMode, setDebugMode] = useState(
    process.env.NODE_ENV === "development",
  );
  const [forceRefresh, setForceRefresh] = useState(0);

  // Debug hook response
  useEffect(() => {
    if (showAddPropertiesModal) {
      console.log("DEBUG MODAL - Modal opened");
    }
  }, [showAddPropertiesModal]);

  // Update URL when selectedIds change
  useEffect(() => {
    if (selectedIds.length > 0) {
      const newParams = new URLSearchParams();
      newParams.set("ids", selectedIds.join(","));
      const newUrl = `/compare?${newParams.toString()}`;
      console.log("Compare Page - Updating URL to:", newUrl);
      router.replace(newUrl, { scroll: false });
    } else if (params?.get("ids")) {
      // Remove ids param if no properties selected
      const newParams = new URLSearchParams(params.toString());
      newParams.delete("ids");
      router.replace(`/compare?${newParams.toString()}`, { scroll: false });
    }
  }, [selectedIds, router, params]);

  // Use the compare endpoint hook
  const {
    data: compareData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCompareProperties(selectedIds, {
    enabled: selectedIds.length > 0,
  });

  console.log("Compare Page - Compare Data:", {
    compareData,
    isLoading,
    isError,
    error,
    selectedIds,
    resultsCount: compareData?.results?.length || 0,
  });

  // Use existing API to fetch all available exclusive properties for the modal
  const {
    data: availablePropertiesData,
    isLoading: isLoadingAvailable,
    isError: isErrorAvailable,
  } = useAllExclusiveProperties({
    enabled: showAddPropertiesModal,
  });

  // DEBUG: Log what the hook returns
  useEffect(() => {
    if (showAddPropertiesModal && availablePropertiesData) {
      const dataObj = availablePropertiesData as any;
      console.log("DEBUG HOOK RESPONSE:", {
        data: availablePropertiesData,
        type: typeof availablePropertiesData,
        isArray: Array.isArray(availablePropertiesData),
        hasResults: dataObj && "results" in dataObj,
        resultsType: dataObj?.results ? typeof dataObj.results : "undefined",
        resultsIsArray: Array.isArray(dataObj?.results),
        resultsLength: dataObj?.results?.length || 0,
        firstItem:
          dataObj?.results?.[0] ||
          (Array.isArray(availablePropertiesData)
            ? availablePropertiesData[0]
            : null),
      });
    }
  }, [showAddPropertiesModal, availablePropertiesData]);

  // Transform the data correctly - FIXED VERSION
  const availablePropertiesDataArray = useMemo(() => {
    console.log("DEBUG TRANSFORMATION - Input data:", availablePropertiesData);

    if (!availablePropertiesData) {
      console.log("DEBUG - No data available");
      return [];
    }

    // CASE 1: If data is already an array
    if (Array.isArray(availablePropertiesData)) {
      console.log(
        "DEBUG - Data is an array, length:",
        availablePropertiesData.length,
      );
      return availablePropertiesData;
    }

    // CASE 2: If data is an object with results property
    const dataObj = availablePropertiesData as any;
    if (dataObj && typeof dataObj === "object") {
      if ("results" in dataObj && Array.isArray(dataObj.results)) {
        return dataObj.results;
      }

      if (dataObj.listing_key) {
        return [dataObj];
      }
    }

    return [];
  }, [availablePropertiesData]);

  console.log("DEBUG FINAL ARRAY:", {
    array: availablePropertiesDataArray,
    length: availablePropertiesDataArray.length,
    firstItem: availablePropertiesDataArray[0],
  });

  // Helper function to create error property
  const createErrorProperty = (
    id: string,
    errorMessage: string,
  ): ComparisonProperty => {
    return {
      id,
      image: "",
      price: "Error",
      address: errorMessage,
      municipality: "Error",
      province: "Error",
      postalCode: "Error",
      propertyType: "Error",
      bedrooms: 0,
      bathrooms: 0,
      totalRooms: 0,
      yearBuilt: null,
      garage: "Error",
      airConditioning: "Error",
      basement: "Error",
      zoning: "Error",
      error: errorMessage,
    };
  };

  // Transform data for comparison using useMemo
  const comparisonProperties = useMemo((): ComparisonProperty[] => {
    if (!selectedIds.length) return [];

    if (
      !compareData ||
      !compareData.results ||
      compareData.results.length === 0
    ) {
      console.log("No compare data available, returning loading state");
      return selectedIds.map((id) => ({
        id,
        image: "",
        price: "Loading...",
        address: "Loading property...",
        municipality: "",
        province: "",
        postalCode: "",
        propertyType: "",
        bedrooms: 0,
        bathrooms: 0,
        totalRooms: 0,
        yearBuilt: null,
        garage: "",
        airConditioning: "",
        basement: "",
        zoning: "",
        error: "Loading data...",
      }));
    }

    console.log("Transforming compare data results:", compareData.results);

    return selectedIds.map((id) => {
      // Find property in results
      const property = compareData.results.find((p: any) => {
        const possibleKeys = [
          p.listing_key,
          p.ListingKey,
          p.PropertyKey,
          p.id?.toString(),
          p.ListingId?.toString(),
          String(p.list_price),
          String(p.property_id),
        ].filter(Boolean);

        console.log(`Looking for ID ${id} in property keys:`, possibleKeys);
        return possibleKeys.some((key) => String(key) === String(id));
      });

      if (!property) {
        console.warn(`Property ${id} not found in results`);
        return createErrorProperty(
          id,
          `Property ${id} not found in API response`,
        );
      }

      console.log(`Found property for ID ${id}:`, property);

      // Helper functions
      const getStringValue = (
        value: any,
        defaultValue: string = "N/A",
      ): string => {
        if (value === null || value === undefined || value === "")
          return defaultValue;
        return String(value).trim() || defaultValue;
      };

      const getNumberValue = (value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined || value === "")
          return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
      };

      // Get image URL
      const getImageUrl = (): string => {
        if (property.media) {
          // Handle object format (your API format)
          if (typeof property.media === "object" && property.media.media_url) {
            return property.media.media_url;
          }
          // Handle array format
          if (Array.isArray(property.media)) {
            const preferredImage = property.media.find(
              (m: any) => m.is_preferred === true,
            );
            if (preferredImage?.media_url) return preferredImage.media_url;

            const firstImage = property.media[0];
            if (firstImage?.media_url) return firstImage.media_url;
          }
        }

        if (Array.isArray(property.Photos) && property.Photos.length > 0) {
          if (property.Photos[0]?.PhotoURL) return property.Photos[0].PhotoURL;
        }

        if (Array.isArray(property.Media) && property.Media.length > 0) {
          if (property.Media[0]?.MediaURL) return property.Media[0].MediaURL;
        }

        if (property.photo_url) return property.photo_url;
        if (property.image_url) return property.image_url;
        if (property.thumbnail_url) return property.thumbnail_url;

        return "";
      };

      // Format price
      const formatPrice = (): string => {
        const priceFields = [
          property.total_actual_rent,
          property.ListPrice,
          property.list_price,
          property.lease_amount,
          property.Price,
          property.price,
          property.asking_price,
          property.sale_price,
        ];

        for (const priceField of priceFields) {
          if (
            priceField !== null &&
            priceField !== undefined &&
            priceField !== ""
          ) {
            const numPrice = Number(priceField);
            if (!isNaN(numPrice) && numPrice > 0) {
              const isLease =
                property.total_actual_rent ||
                property.lease_amount ||
                property.StandardStatus?.toLowerCase().includes("lease") ||
                property.category_type?.toLowerCase().includes("lease");

              if (isLease) {
                return `$${numPrice.toLocaleString()}/month`;
              }
              return `$${numPrice.toLocaleString()}`;
            }
          }
        }

        return "Price on request";
      };

      // Build the comparison property object
      const comparisonProperty: ComparisonProperty = {
        id:
          property.listing_key ||
          property.ListingKey ||
          property.PropertyKey ||
          id,
        image: getImageUrl(),
        price: formatPrice(),
        address: getStringValue(
          property.unparsed_address ||
            property.address ||
            property.FullAddress ||
            property.StreetAddress ||
            property.Address ||
            property.street_address,
          "Address not available",
        ),
        municipality: getStringValue(
          property.city ||
            property.City ||
            property.Municipality ||
            property.town,
          "N/A",
        ),
        province: getStringValue(
          property.state_or_province ||
            property.StateOrProvince ||
            property.State ||
            property.Province ||
            "ON",
        ),
        postalCode: getStringValue(
          property.postal_code ||
            property.postalCode ||
            property.PostalCode ||
            property.zip_code,
          "N/A",
        ),
        propertyType: getStringValue(
          property.property_sub_type ||
            property.PropertySubType ||
            property.PropertyType ||
            property.property_type ||
            property.category_type ||
            property.type ||
            "Property",
        ),
        bedrooms: getNumberValue(
          property.bedrooms_total ||
            property.BedroomsTotal ||
            property.bedrooms,
        ),
        bathrooms: getNumberValue(
          property.bathrooms_total_integer ||
            property.BathroomsTotalInteger ||
            property.bathrooms,
        ),
        totalRooms: getNumberValue(
          property.total_rooms ||
            (Array.isArray(property.rooms)
              ? property.rooms.length
              : Array.isArray(property.Rooms)
                ? property.Rooms.length
                : 0),
        ),
        yearBuilt: (() => {
          const yearFields = [
            property.year_built,
            property.YearBuilt,
            property.ConstructionYear,
            property.year_constructed,
          ];

          for (const yearField of yearFields) {
            if (yearField) {
              const year = Number(yearField);
              if (
                !isNaN(year) &&
                year > 1800 &&
                year <= new Date().getFullYear() + 1
              ) {
                return year;
              }
            }
          }
          return null;
        })(),
        garage: (() => {
          const parkingTotal = getNumberValue(
            property.parking_total || property.ParkingTotal,
          );
          if (parkingTotal > 0)
            return `${parkingTotal} space${parkingTotal > 1 ? "s" : ""}`;

          const parkingFeatures = getStringValue(
            property.parking_features || property.ParkingFeatures,
          );
          if (
            parkingFeatures &&
            !parkingFeatures.toLowerCase().includes("no")
          ) {
            return parkingFeatures;
          }

          const garageSpaces = getNumberValue(
            property.GarageSpaces || property.garage_spaces,
          );
          if (garageSpaces > 0) return `${garageSpaces} car garage`;

          return "None";
        })(),
        airConditioning: (() => {
          const cooling = getStringValue(property.cooling || property.Cooling);
          return cooling === "" || cooling.toLowerCase() === "none"
            ? "None"
            : cooling;
        })(),
        basement: (() => {
          const basement = getStringValue(
            property.basement || property.Basement,
          );
          return basement === "" || basement.toLowerCase() === "none"
            ? "None"
            : basement;
        })(),
        zoning: getStringValue(
          property.zoning || property.Zoning,
          "Residential",
        ),
        rawData: property,
      };

      console.log(`Created comparison property for ${id}:`, comparisonProperty);
      return comparisonProperty;
    });
  }, [selectedIds, compareData]);

  const handleAddProperty = (property: any) => {
    const propertyId = getPropertyKey(property);
    if (!selectedIds.includes(propertyId)) {
      const newSelectedIds = [...selectedIds, propertyId];
      setSelectedIds(newSelectedIds);
      addToCompare(property);
      console.log("Added property:", propertyId, "New IDs:", newSelectedIds);
      setShowAddPropertiesModal(false); // Close modal after adding
    }
  };

  const handleRemoveProperty = (propertyId: string) => {
    const newSelectedIds = selectedIds.filter((id) => id !== propertyId);
    setSelectedIds(newSelectedIds);
    removeFromGlobalCompare(propertyId);
    console.log("Removed property:", propertyId, "New IDs:", newSelectedIds);
  };

  const handleForceRefresh = () => {
    console.log("Force refreshing...");
    setForceRefresh((prev) => prev + 1);
    refetch();
  };

  // Filter available properties based on search term and exclude already selected ones
  const filteredAvailableProperties = availablePropertiesDataArray.filter(
    (property: Property) => {
      const propertyId = property.listing_key || "";
      if (selectedIds.includes(propertyId)) {
        return false;
      }

      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      const address = property.unparsed_address || "";
      const city = property.city || "";
      const propertyType = property.property_sub_type || "";
      const listingKey = property.listing_key || "";

      return (
        address.toLowerCase().includes(searchLower) ||
        city.toLowerCase().includes(searchLower) ||
        propertyType.toLowerCase().includes(searchLower) ||
        listingKey.toLowerCase().includes(searchLower)
      );
    },
  );

  console.log("DEBUG - Filtered Properties:", {
    searchTerm,
    filteredCount: filteredAvailableProperties.length,
    filteredFirst: filteredAvailableProperties[0],
  });

  // Loading state
  if (isLoading && selectedIds.length > 0) {
    return (
      <div className="min-h-screen bg-[#0b1220]">
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
          <div className="flex flex-col items-center max-w-md text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Properties</h2>
            <p className="text-gray-400 mb-4">
              Comparing {selectedIds.length} propert
              {selectedIds.length === 1 ? "y" : "ies"}...
            </p>
            <div className="text-sm text-gray-500">
              <p>Selected IDs: {selectedIds.join(", ")}</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (isError) {
    console.error("Compare Page - Error loading properties:", error);
    return (
      <div className="min-h-screen bg-[#0b1220]">
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
          <div className="max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Error Loading Properties
            </h2>
            <p className="text-gray-300 mb-4">
              Failed to load comparison data. Please try again.
            </p>
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-sm font-mono text-left break-all">
                {error?.message || "Unknown error"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleForceRefresh}
                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Empty state
  if (selectedIds.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b1220]">
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4">No Properties Selected</h1>
            <p className="text-gray-400 mb-8">
              Select properties from our exclusive listings to compare their
              features side by side.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const successfulProperties = comparisonProperties.filter((p) => !p.error);
  const errorProperties = comparisonProperties.filter((p) => p.error);

  return (
    <div className="min-h-screen bg-[#0b1220]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 p-6 border-b">
            {/* Error Alert */}
            {errorProperties.length > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium">
                      {errorProperties.length} propert
                      {errorProperties.length === 1 ? "y" : "ies"} failed to
                      load
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Some properties could not be loaded. They may have been
                      removed or there might be a temporary issue.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HORIZONTAL SCROLL IMAGE ROW */}
          <div className="p-6 border-b">
            <div className="flex space-x-6 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {comparisonProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex-shrink-0 w-80 rounded-lg overflow-hidden shadow-lg border border-gray-200 relative transition-transform hover:scale-[1.02]"
                >
                  <button
                    onClick={() => handleRemoveProperty(property.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10 hover:bg-red-600 transition-colors"
                    title="Remove property"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {property.image ? (
                    <div className="h-48 bg-gray-100">
                      <Image
                        src={property.image}
                        alt={property.address}
                        width={320}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">No Image Available</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {property.propertyType}
                    </h3>
                    <p className="text-gray-600 text-sm truncate">
                      {property.address}
                    </p>
                    <p className="text-gray-600 text-sm truncate">
                      {property.municipality}, {property.province}
                    </p>
                    <p className="text-lg font-bold mt-2 text-blue-600">
                      {property.price}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </span>
                      {property.yearBuilt && (
                        <span>Built {property.yearBuilt}</span>
                      )}
                    </div>
                    {property.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-600 text-xs">{property.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* ADD PROPERTY CARD */}
              <div className="flex-shrink-0 w-80">
                <button
                  onClick={() => setShowAddPropertiesModal(true)}
                  className="w-full h-full min-h-[280px] border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-gray-700 font-medium">Add Property</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Click to add more properties
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Max 5 properties can be compared
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* COMPARISON TABLE */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                {[
                  {
                    label: "Price",
                    key: "price",
                    format: (value: any) => value,
                  },
                  {
                    label: "Address",
                    key: "address",
                    format: (value: any) => value,
                  },
                  {
                    label: "City",
                    key: "municipality",
                    format: (value: any) => value,
                  },
                  {
                    label: "Province",
                    key: "province",
                    format: (value: any) => value,
                  },
                  {
                    label: "Postal Code",
                    key: "postalCode",
                    format: (value: any) => value,
                  },
                  {
                    label: "Property Type",
                    key: "propertyType",
                    format: (value: any) => value,
                  },
                  {
                    label: "Bedrooms",
                    key: "bedrooms",
                    format: (value: any) => (value > 0 ? value : "—"),
                  },
                  {
                    label: "Bathrooms",
                    key: "bathrooms",
                    format: (value: any) => (value > 0 ? value : "—"),
                  },
                  {
                    label: "Total Rooms",
                    key: "totalRooms",
                    format: (value: any) => (value > 0 ? value : "—"),
                  },
                  {
                    label: "Year Built",
                    key: "yearBuilt",
                    format: (value: any) => value || "—",
                  },
                  {
                    label: "Garage/Parking",
                    key: "garage",
                    format: (value: any) => value,
                  },
                  {
                    label: "Air Conditioning",
                    key: "airConditioning",
                    format: (value: any) => value,
                  },
                  {
                    label: "Basement",
                    key: "basement",
                    format: (value: any) => value,
                  },
                  {
                    label: "Zoning",
                    key: "zoning",
                    format: (value: any) => value,
                  },
                ].map(({ label, key, format }) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-900 whitespace-nowrap w-48">
                      {label}
                    </td>
                    {comparisonProperties.map((property) => (
                      <td
                        key={`${property.id}-${key}`}
                        className="px-6 py-4 text-center text-gray-700 whitespace-nowrap min-w-[200px]"
                      >
                        {property.error ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          format(property[key as keyof ComparisonProperty])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}

          {/* Debug Info */}
        </div>
      </div>

      <Footer />

      {/* ADD PROPERTIES MODAL */}
      {showAddPropertiesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Add Properties to Compare
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Select up to {5 - selectedIds.length} more propert
                    {5 - selectedIds.length === 1 ? "y" : "ies"} to compare
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPropertiesModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search Bar in Modal */}
              <div className="mt-4"></div>

              {/* Debug Info in Modal */}
            </div>

            <div className="flex-1 overflow-hidden">
              {isLoadingAvailable ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-gray-600">
                    Loading available properties...
                  </span>
                  <span className="text-gray-400 text-sm mt-1">
                    Please wait while we fetch properties...
                  </span>
                </div>
              ) : isErrorAvailable ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <p className="text-red-600 font-medium mb-2">
                    Failed to load properties
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    Please try again later
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="overflow-y-auto h-full">
                  {filteredAvailableProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-6"></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                      {filteredAvailableProperties.map((property: Property) => {
                        // Get property ID - from your API response
                        const propertyId = property.listing_key || "";

                        const isSelected = selectedIds.includes(propertyId);
                        const isMaxReached = selectedIds.length >= 5;

                        // Get image URL - FIXED for your API structure
                        const getImageUrl = () => {
                          // Handle media as array (normalized)
                          if (
                            Array.isArray(property.media) &&
                            property.media.length > 0
                          ) {
                            return property.media[0].media_url;
                          }

                          // Handle media as single object (fallback)
                          const mediaObj = property.media as any;
                          if (
                            mediaObj &&
                            typeof mediaObj === "object" &&
                            mediaObj.media_url
                          ) {
                            return mediaObj.media_url;
                          }

                          // Fallback
                          return "";
                        };

                        // Get address - from your API
                        const getAddress = () => {
                          return (
                            property.unparsed_address || "Address not available"
                          );
                        };

                        // Get city
                        const getCity = () => {
                          return property.city || "N/A";
                        };

                        // Get property type
                        const getPropertyType = () => {
                          return property.property_sub_type || "Property";
                        };

                        // Get price - from your API
                        const getPrice = () => {
                          if (property.list_price) {
                            const numPrice = Number(property.list_price);
                            if (!isNaN(numPrice) && numPrice > 0) {
                              return `$${numPrice.toLocaleString()}`;
                            }
                          }
                          return "Price on request";
                        };

                        // Get bedrooms and bathrooms
                        const bedrooms = property.bedrooms_total || 0;
                        const bathrooms = property.bathrooms_total_integer || 0;

                        return (
                          <div
                            key={propertyId}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : isMaxReached && !isSelected
                                  ? "opacity-50 cursor-not-allowed"
                                  : "border-gray-200 hover:border-blue-300"
                            }`}
                            onClick={() => {
                              if (isMaxReached && !isSelected) return;
                              if (isSelected) {
                                handleRemoveProperty(propertyId);
                              } else {
                                handleAddProperty(property);
                              }
                            }}
                          >
                            <div className="flex gap-4">
                              {getImageUrl() ? (
                                <div className="w-24 h-24 flex-shrink-0">
                                  <Image
                                    src={getImageUrl() || ""}
                                    alt={getAddress() || ""}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover rounded"
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                  <span className="text-gray-500 text-sm">
                                    No Image
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {getAddress()}
                                </h3>
                                <p className="text-gray-600 text-sm truncate">
                                  {getCity()},{" "}
                                  {property.state_or_province || "ON"}
                                </p>
                                <p className="text-gray-600 text-sm truncate">
                                  {getPropertyType()}
                                </p>
                                <p className="text-blue-600 font-semibold mt-1 truncate">
                                  {getPrice()}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <div className="text-xs text-gray-500 truncate">
                                    {bedrooms} bed • {bathrooms} bath
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                      isSelected
                                        ? "bg-red-100 text-red-700"
                                        : isMaxReached && !isSelected
                                          ? "bg-gray-100 text-gray-500"
                                          : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {isSelected
                                      ? "Selected"
                                      : isMaxReached
                                        ? "Max Reached"
                                        : "Select"}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 truncate">
                                  ID: {propertyId || "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{selectedIds.length}</span>{" "}
                    of 5 properties selected
                  </p>
                  {filteredAvailableProperties.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Showing {filteredAvailableProperties.length} of{" "}
                      {availablePropertiesDataArray.length} properties
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddPropertiesModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPropertiesModal(false);
                      if (selectedIds.length === 0) {
                        router.push("/exclusive-properties");
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {selectedIds.length === 0 ? "Browse Properties" : "Done"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-semibold">Loading Comparison...</p>
          </div>
        </div>
      }
    >
      <ComparePageContent />
    </React.Suspense>
  );
}
