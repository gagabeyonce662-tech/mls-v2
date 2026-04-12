import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { ComparisonProperty } from "./types";

interface PropertyCardProps {
  property: ComparisonProperty;
  onRemove: (id: string) => void;
}

export function PropertyCard({ property, onRemove }: PropertyCardProps) {
  return (
    <div className="flex-shrink-0 w-80 rounded-lg overflow-hidden shadow-lg border border-gray-200 relative transition-transform hover:scale-[1.02]">
      <button
        onClick={() => onRemove(property.id)}
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
        <p className="text-gray-600 text-sm truncate">{property.address}</p>
        <p className="text-gray-600 text-sm truncate">
          {property.municipality}, {property.province}
        </p>
        <p className="text-lg font-bold mt-2 text-blue-600">{property.price}</p>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <span>
            {property.bedrooms} bed • {property.bathrooms} bath
          </span>
          {property.yearBuilt && <span>Built {property.yearBuilt}</span>}
        </div>
        {property.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-xs">{property.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
