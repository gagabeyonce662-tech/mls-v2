// components/PropertyCard.tsx
import React from "react";
import { PropertyMarker } from "./types";
import { formatPrice } from "@/lib/helpers";
import StreetViewButton from "./StreetViewButton";

export default function PropertyCard({
  property,
  onViewOnMap,
  onViewStreetView,
  isSelected,
}: {
  property: PropertyMarker;
  onViewOnMap: () => void;
  onViewStreetView: () => void;
  isSelected: boolean;
}) {
  const formatSquareFeet = (sqft: string | number | undefined) => {
    if (!sqft) return "N/A";
    const numSqft = typeof sqft === "string" ? parseFloat(sqft) : sqft;
    if (isNaN(numSqft)) return String(sqft);
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numSqft) + " sqft";
  };

  const raw = property.raw || {};
  const getPropertyPhoto = () => {
    if (raw.media && raw.media.length > 0) {
      const preferred = raw.media.find((m: any) => m.is_preferred);
      return preferred ? preferred.media_url : raw.media[0].media_url;
    }
    return null;
  };

  const details = {
    address: raw.unparsed_address || raw.city || property.title || "Address not available",
    city: raw.city || "N/A",
    cityRegion: raw.city_region || "N/A",
    bedrooms: raw.bedrooms_total || "N/A",
    bathrooms: raw.bathrooms_total_integer || "N/A",
    squareFeet: raw.building_area_total,
    propertyType: raw.property_sub_type || "Unknown",
    yearBuilt: raw.year_built,
    status: raw.standard_status || "Unknown",
    listingId: raw.listing_id || "N/A",
    listingUrl: raw.listing_url,
    photosCount: raw.photos_count || 0,
    category: raw.category_type || "N/A",
  };

  const photo = getPropertyPhoto();
  const listingUrl =
  details.listingUrl && !details.listingUrl.startsWith("http")
    ? `https://${details.listingUrl}`
    : details.listingUrl;


  return (
    <div
      className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${
        isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
      }`}
      onClick={onViewOnMap}
    >
      {photo ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img src={photo} alt={details.address} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{details.photosCount} photos</div>
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${details.category === "exclusive" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
              {details.category}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm">{details.address}</h3>
          <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded ml-2 whitespace-nowrap">{details.status}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
          <span className="truncate">{details.city}, {details.cityRegion}</span>
        </div>

        <div className="mb-3"><div className="text-lg font-bold text-gray-900">{formatPrice(property.price)}</div></div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center"><svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z" clipRule="evenodd" /></svg><span>{details.bedrooms} bed</span></div>
          <div className="flex items-center"><svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg><span>{details.bathrooms} bath</span></div>
          <div className="flex items-center"><svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg><span>{formatSquareFeet(details.squareFeet)}</span></div>
          <div className="flex items-center"><svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg><span>{details.yearBuilt || "N/A"}</span></div>
        </div>

        <div className="mb-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{details.propertyType}</span></div>

        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); onViewOnMap(); }} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">View on Map</button>
          <button onClick={(e) => { e.stopPropagation(); onViewStreetView(); }} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Street View</button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Listing ID: {details.listingId}</span>
           {listingUrl && (
              <a
                href={listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Details →
              </a>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
