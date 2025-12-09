"use client";

import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import React from "react";
import { useMultipleProperties } from "@/lib/react-query";

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
}

export default function ComparePage() {
  const params = useSearchParams();
  
  // Extract property IDs from URL with proper decoding
  const ids = React.useMemo(() => {
    if (!params) return [];
    
    try {
      // Get the 'ids' parameter
      const idsParam = params.get('ids');
      if (!idsParam) {
        // Check if there are multiple 'ids' parameters
        const allIds = params.getAll('ids');
        if (allIds.length > 0) {
          return allIds.map(id => decodeURIComponent(id).trim()).filter(Boolean);
        }
        return [];
      }
      
      // Decode the parameter and split by comma
      const decodedIds = decodeURIComponent(idsParam);
      return decodedIds
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);
    } catch (error) {
      console.error('Error parsing property IDs:', error);
      return [];
    }
  }, [params]);

  // Use TanStack Query to fetch all properties at once
  const { 
    data: properties = [], 
    isLoading, 
    isError,
    error 
  } = useMultipleProperties(ids, {
    enabled: ids.length > 0,
  });

  // Transform data for comparison - UPDATED for correct data structure
  const comparisonProperties: ComparisonProperty[] = ids.map((id, index) => {
    const property = properties[index];
    
    if (!property) {
      return {
        id,
        image: "",
        price: "N/A",
        address: "Not Found",
        municipality: "N/A",
        province: "ON",
        postalCode: "N/A",
        propertyType: "Unknown",
        bedrooms: 0,
        bathrooms: 0,
        totalRooms: 0,
        yearBuilt: null,
        garage: "N/A",
        airConditioning: "N/A",
        basement: "N/A",
        zoning: "N/A",
        error: `Property ${id} not found or failed to load`
      };
    }

    // Get image URL from Media array
    const getImageUrl = (property: any): string => {
      if (Array.isArray(property.Media) && property.Media.length > 0) {
        // Find preferred photo or first photo
        const preferredPhoto = property.Media.find((m: any) => m.PreferredPhotoYN === true);
        const firstPhoto = property.Media[0];
        const photo = preferredPhoto || firstPhoto;
        if (photo?.MediaURL) return photo.MediaURL;
      }
      
      // Alternative property structures
      if (Array.isArray(property.media) && property.media.length > 0) {
        const img = property.media.find((m: any) => m.media_url) || property.media[0];
        if (img?.media_url) return img.media_url;
      }
      
      if (Array.isArray(property.Photos) && property.Photos.length > 0) {
        const p = property.Photos[0];
        if (p.PhotoURL) return p.PhotoURL;
      }
      
      return "";
    };

    // Format price - check for ListPrice or other price fields
    const formatPrice = (property: any): string => {
      // First check ListPrice
      if (property.ListPrice !== null && property.ListPrice !== undefined) {
        return `$${Number(property.ListPrice).toLocaleString()}`;
      }
      
      // Check for lease amount if it's a rental
      if (property.TotalActualRent) {
        return `$${Number(property.TotalActualRent).toLocaleString()}/month`;
      }
      
      // Check other common price fields
      const priceFields = ['Price', 'price', 'list_price', 'SalePrice'];
      for (const field of priceFields) {
        if (property[field] !== null && property[field] !== undefined) {
          const priceValue = property[field];
          if (typeof priceValue === 'number') {
            return `$${priceValue.toLocaleString()}`;
          }
          if (typeof priceValue === 'string') {
            const parsed = parseFloat(priceValue.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(parsed)) {
              return `$${parsed.toLocaleString()}`;
            }
          }
        }
      }
      
      return "Price on request";
    };

    // Get full address from UnparsedAddress or build it
    const getAddress = (property: any): string => {
      if (property.UnparsedAddress) return property.UnparsedAddress;
      
      // Build address from components
      const parts = [];
      if (property.UnitNumber) parts.push(`${property.UnitNumber}-`);
      if (property.StreetNumber) parts.push(property.StreetNumber);
      if (property.StreetDirPrefix) parts.push(property.StreetDirPrefix);
      if (property.StreetName) parts.push(property.StreetName);
      if (property.StreetSuffix) parts.push(property.StreetSuffix);
      if (property.StreetDirSuffix) parts.push(property.StreetDirSuffix);
      
      return parts.join(' ').trim() || "N/A";
    };

    // Get property type from PropertySubType or StructureType
    const getPropertyType = (property: any): string => {
      if (property.PropertySubType) return property.PropertySubType;
      if (Array.isArray(property.StructureType) && property.StructureType.length > 0) {
        return property.StructureType[0];
      }
      if (property.StructureType) return property.StructureType;
      if (property.property_type) return property.property_type;
      return "Property";
    };

    // Get basement information
    const getBasement = (property: any): string => {
      if (Array.isArray(property.Basement) && property.Basement.length > 0) {
        return property.Basement.filter((b: string) => b && b !== "N/A").join(", ") || "N/A";
      }
      if (property.Basement) return property.Basement;
      if (property.basement) return property.basement;
      return "N/A";
    };

    // Get air conditioning information
    const getAirConditioning = (property: any): string => {
      if (Array.isArray(property.Cooling) && property.Cooling.length > 0) {
        return property.Cooling.join(", ");
      }
      if (property.Cooling) return property.Cooling;
      if (property.air_conditioning) return property.air_conditioning;
      return "N/A";
    };

    // Get garage/parking information
    const getGarage = (property: any): string => {
      if (property.ParkingTotal && property.ParkingTotal > 0) {
        return `${property.ParkingTotal} spaces`;
      }
      
      if (Array.isArray(property.ParkingFeatures) && property.ParkingFeatures.length > 0) {
        const features = property.ParkingFeatures.filter((f: string) => f && f !== "No Garage");
        if (features.length > 0) {
          return features.join(", ");
        }
        return "None";
      }
      
      return "None";
    };

    // Get year built - handle null
    const getYearBuilt = (property: any): number | null => {
      if (property.YearBuilt !== null && property.YearBuilt !== undefined) {
        const year = Number(property.YearBuilt);
        return !isNaN(year) && year > 0 ? year : null;
      }
      if (property.year_built) {
        const year = Number(property.year_built);
        return !isNaN(year) && year > 0 ? year : null;
      }
      return null;
    };

    return {
      id: property.ListingKey || property.listing_key || property.PropertyKey || property.id || id,
      image: getImageUrl(property),
      price: formatPrice(property),
      address: getAddress(property),
      municipality: property.City || property.city || property.Municipality || "N/A",
      province: property.StateOrProvince || property.state || "ON",
      postalCode: property.PostalCode || property.postal_code || "N/A",
      propertyType: getPropertyType(property),
      bedrooms: property.BedroomsTotal || property.bedrooms_total || property.bedrooms || 0,
      bathrooms: property.BathroomsTotalInteger || property.bathrooms_total_integer || property.bathrooms || 0,
      totalRooms: property.BedroomsTotal + property.BathroomsTotalInteger || 0, // Estimate total rooms
      yearBuilt: getYearBuilt(property),
      garage: getGarage(property),
      airConditioning: getAirConditioning(property),
      basement: getBasement(property),
      zoning: property.Zoning || property.zoning || "Residential"
    };
  });

  // Filter out properties that failed to load
  const validProperties = comparisonProperties.filter(p => !p.error);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b1220]">
        <Header />
        <div className="min-h-screen flex items-center justify-center text-white">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading comparison for {ids.length} properties...</p>
            <p className="text-sm text-gray-400 mt-2">Please wait</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (isError) {
    console.error('Error loading properties:', error);
    return (
      <div className="min-h-screen bg-[#0b1220]">
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
          <div className="text-xl mb-4">Error loading properties</div>
          <p className="mb-6">Failed to load comparison data. Please try again.</p>
          <div className="flex gap-4">
            <a
              href="/exclusive-properties"
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Browse Properties
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-800 transition"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Empty state
  if (!comparisonProperties.length || ids.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b1220]">
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
          <div className="text-xl mb-4">No properties to compare</div>
          <p className="mb-6">Select properties to compare from the listings page</p>
          <a
            href="/exclusive-properties"
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Browse Properties
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Property Comparison
              </h1>
              <p className="text-gray-600 mt-2">
                Comparing {validProperties.length} of {ids.length} properties
              </p>
            </div>
            {comparisonProperties.some(p => p.error) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  Some properties failed to load. Showing available data.
                </p>
              </div>
            )}
          </div>

          {/* IMAGE ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {comparisonProperties.map((property) => (
              <div key={property.id} className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                {property.image ? (
                  <div className="relative h-64">
                    <img 
                      src={property.image} 
                      alt={property.address}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                    {property.error && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Error
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {property.propertyType}
                    {property.error && <span className="text-red-500 text-sm ml-2">({property.error})</span>}
                  </h3>
                  <p className="text-gray-600 text-sm truncate">{property.municipality}, {property.province}</p>
                  <p className="text-lg font-bold mt-2 text-blue-600">{property.price}</p>
                </div>
              </div>
            ))}
          </div>

          {/* COMPARISON TABLE */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                {[
                  { label: "Price", key: "price", format: (value: any) => value },
                  { label: "Address", key: "address", format: (value: any) => value },
                  { label: "Location", key: "municipality", format: (value: any) => value },
                  { label: "Province", key: "province", format: (value: any) => value },
                  { label: "Postal Code", key: "postalCode", format: (value: any) => value },
                  { label: "Property Type", key: "propertyType", format: (value: any) => value },
                  { label: "Bedrooms", key: "bedrooms", format: (value: any) => value || "—" },
                  { label: "Bathrooms", key: "bathrooms", format: (value: any) => value || "—" },
                  { label: "Year Built", key: "yearBuilt", format: (value: any) => value || "—" },
                  { label: "Garage/Parking", key: "garage", format: (value: any) => value },
                  { label: "Air Conditioning", key: "airConditioning", format: (value: any) => value },
                  { label: "Basement", key: "basement", format: (value: any) => value },
                  { label: "Zoning", key: "zoning", format: (value: any) => value }
                ].map(({ label, key, format }) => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-900 whitespace-nowrap">
                      {label}
                    </td>
                    {comparisonProperties.map((property) => (
                      <td 
                        key={`${property.id}-${key}`} 
                        className="px-6 py-4 text-center text-gray-700 whitespace-nowrap"
                      >
                        {property.error ? "—" : format(property[key as keyof ComparisonProperty])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <a
              href="/exclusive-properties"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition w-full sm:w-auto text-center"
            >
              ← Back to Listings
            </a>
            <div className="flex gap-4 w-full sm:w-auto">
              {validProperties.length > 0 && (
                <a
                  href={`/listing/${validProperties[0].id}`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto text-center"
                >
                  View Details
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}