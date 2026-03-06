"use client";

import { Bed, Bath, Ruler, MapPin, CalendarDays } from "lucide-react";
import { colors } from "@/config/design-system";
import {
  getPrice,
  formatPrice,
  getCity,
  getPropertyType,
  getBedrooms,
  getBathrooms,
  getAddress,
  getSqft,
  getYearBuilt,
} from "@/lib/propertyUtils";
import type { Property } from "@/lib/api";

interface PropertyCardContentProps {
  property: Property;
}

export function PropertyCardContent({ property }: PropertyCardContentProps) {
  // Extract data from Utils
  const price = getPrice(property);
  const city = getCity(property);
  const type = getPropertyType(property);
  const beds = getBedrooms(property);
  const baths = getBathrooms(property);
  const address = getAddress(property);
  const sqft = getSqft(property);
  const yearBuilt = getYearBuilt(property);

  return (
    <div className="p-4">
      {/* Price */}
      <p
        className="text-lg font-bold mb-1"
        style={{ color: price > 0 ? colors.primary : colors.body }}
      >
        {formatPrice(price)}
      </p>

      {/* Title */}
      <h3
        className="font-semibold text-sm truncate mb-1"
        style={{ color: colors.heading }}
      >
        {type} in {city}
      </h3>

      {/* Address */}
      {address && (
        <p
          className="text-xs truncate flex items-center gap-1 mb-3"
          style={{ color: colors.body }}
        >
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {address}
        </p>
      )}

      {/* Divider */}
      <div
        className="border-t my-2"
        style={{ borderColor: colors.cardsBoarder }}
      />

      {/* Features row */}
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: colors.body }}
      >
        {beds > 0 && (
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            <span>
              {beds} {beds === 1 ? "Bed" : "Beds"}
            </span>
          </div>
        )}
        {baths > 0 && (
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            <span>
              {baths} {baths === 1 ? "Bath" : "Baths"}
            </span>
          </div>
        )}
        {sqft && (
          <div className="flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5" />
            <span>{sqft.toLocaleString('en-US')} sqft</span>
          </div>
        )}
        {yearBuilt && (
          <div className="flex items-center gap-1 ml-auto">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{yearBuilt}</span>
          </div>
        )}
      </div>
    </div>
  );
}
