"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { Bed, Bath, Maximize } from "lucide-react";
import { ds } from "@/lib/design-system-utils";
import Link from "next/link";

interface SimilarPropertiesProps {
  currentPropertyId: string;
  city: string;
  propertyType: string;
  listPrice?: string;
  bedrooms?: number;
}

interface SimilarProperty {
  id: string;
  listing_key: string;
  list_price: string | number;
  city: string;
  address: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  building_area: string;
  property_type: string;
  status: string;
  photos_count: number;
  media: Array<{ media_url: string }>;
  year_built: string;
  listing_url: string;
}

export default function SimilarProperties({
  currentPropertyId,
  city,
  propertyType,
  listPrice,
  bedrooms,
}: SimilarPropertiesProps) {
  const router = useRouter();
  const [similarProperties, setSimilarProperties] = useState<SimilarProperty[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilarProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams({
          limit: "3",
          offset: "0",
        });

        // Filter by city for similarity
        if (city && city !== "N/A") {
          params.set("city", city);
        }

        // Add price range filter if available
        if (listPrice) {
          const price = parseFloat(listPrice);
          if (!isNaN(price)) {
            params.set("price_min", Math.floor(price * 0.8).toString());
            params.set("price_max", Math.ceil(price * 1.2).toString());
          }
        }

        // Add bedrooms filter if available
        if (bedrooms) {
          params.set("bedrooms_min", Math.max(1, bedrooms - 1).toString());
          params.set("bedrooms_max", (bedrooms + 1).toString());
        }

        const apiUrl = `http://https://staging.vsell4u.ca/api/mls/properties/exclusive-properties/?${params}`;

        console.log("Fetching similar properties from:", apiUrl);

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Filter out the current property and map to similar properties format
        const properties = (data.results || [])
          .filter((prop: any) => prop.listing_key !== currentPropertyId)
          .slice(0, 3)
          .map((prop: any) => ({
            id: prop.listing_key || prop.PropertyKey,
            listing_key: prop.listing_key,
            list_price: prop.list_price,
            city: prop.city || "",
            address: prop.unparsed_address || "",
            province: prop.StateOrProvince || "",
            bedrooms: prop.bedrooms_total || 0,
            bathrooms: prop.bathrooms_total_integer || 0,
            building_area: prop.building_area_total,
            property_type: prop.category_type || prop.PropertyType,
            status: prop.standard_status || "Active",
            photos_count: prop.photos_count,
            media: prop.media || [],
            year_built: prop.year_built,
            listing_url: prop.listing_url,
          }));

        console.log("Found similar properties:", properties.length);
        setSimilarProperties(properties);
      } catch (error) {
        console.error("Error fetching similar properties:", error);
        setError("Failed to load similar properties");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarProperties();
  }, [currentPropertyId, city, propertyType, listPrice, bedrooms]);

  // Helper function to format similar property price
  const formatSimilarPropertyPrice = (price: string | number) => {
    if (!price) return "Price on request";
    if (typeof price === "string") {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice)) return "Price on request";
      return `$${numPrice.toLocaleString()}`;
    }
    return `$${price.toLocaleString()}`;
  };

  // Helper function to get similar property image
  const getSimilarPropertyImage = (prop: SimilarProperty, index: number) => {
    if (prop.media && prop.media.length > 0) {
      return prop.media[0].media_url;
    }
    // Fallback images
    const fallbackImages = [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
    ];
    return fallbackImages[index % fallbackImages.length];
  };

  // Handle property click
  const handlePropertyClick = (propertyId: string) => {
    router.push(`/listing/${propertyId}`);
  };

  return (
    <div className="mt-16">
      <h2 className={`${ds.h2} mb-8`}>Similar Properties</h2>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className={`${ds.bodyRegular} text-gray-600 mt-4`}>
            Loading similar properties...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className={`${ds.bodyRegular} text-red-600 mb-4`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-2 bg-ds-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : similarProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarProperties.map((similarProperty, index) => (
            <div
              key={similarProperty.id}
              onClick={() => handlePropertyClick(similarProperty.id)}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="relative h-48">
                <Image
                  src={getSimilarPropertyImage(similarProperty, index)}
                  alt={similarProperty.address}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-ds-primary text-white px-2 py-1 rounded text-sm font-semibold">
                  {similarProperty.property_type || "Property"}
                </div>
                {similarProperty.status && (
                  <div
                    className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-semibold ${
                      similarProperty.status === "Active"
                        ? "bg-green-500 text-white"
                        : similarProperty.status === "Pending"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-500 text-white"
                    }`}
                  >
                    {similarProperty.status}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className={`${ds.h4} text-ds-primary mb-2`}>
                  {formatSimilarPropertyPrice(similarProperty.list_price)}
                </h3>
                <p
                  className={`${ds.bodyRegular} text-ds-heading mb-1 truncate`}
                >
                  {similarProperty.address || "Address not available"}
                </p>
                <p className={`${ds.small} text-ds-body mb-3`}>
                  {similarProperty.city || city},{" "}
                  {similarProperty.province || "Ontario"}
                </p>
                <div className="flex items-center gap-4 text-ds-body text-sm">
                  {similarProperty.bedrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      <span>{similarProperty.bedrooms}</span>
                    </div>
                  )}
                  {similarProperty.bathrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      <span>{similarProperty.bathrooms}</span>
                    </div>
                  )}
                  {similarProperty.building_area && (
                    <div className="flex items-center gap-1">
                      <Maximize className="w-4 h-4" />
                      <span>{similarProperty.building_area} sq ft</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className={`${ds.bodyRegular} text-gray-600 mb-4`}>
            No similar properties found at the moment.
          </p>
          <Link
            href={`/listings?city=${encodeURIComponent(city)}`}
            className="inline-block px-6 py-2 bg-ds-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            View All Properties in {city}
          </Link>
        </div>
      )}
    </div>
  );
}
