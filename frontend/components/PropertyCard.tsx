// components/PropertyCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bed,
  Bath,
  Loader2,
  Calendar,
  MapPin,
  Ruler,
  CalendarDays,
} from "lucide-react";
import { colors, propertyCard } from "@/config/design-system";
import type { Property } from "@/lib/api";
import {
  getPropertyKey,
  getPrice,
  formatPrice,
  getCity,
  getPropertyType,
  getBedrooms,
  getBathrooms,
  getStatus,
  getAddress,
  getSqft,
  getYearBuilt,
  getListingDate,
  getThumbnail,
} from "@/lib/propertyUtils";

/* ──────────────────────────── component ──────────────────────────── */

interface PropertyCardProps {
  property: Property;
  variant?: "new" | "featured";
  index?: number;
}

export default function PropertyCard({
  property,
  variant = "featured",
  index = 0,
}: PropertyCardProps) {
  const [clicked, setClicked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const propertyKey = getPropertyKey(property);
  const price = getPrice(property);
  const city = getCity(property);
  const type = getPropertyType(property);
  const beds = getBedrooms(property);
  const baths = getBathrooms(property);
  const status = getStatus(property);
  const address = getAddress(property);
  const sqft = getSqft(property);
  const yearBuilt = getYearBuilt(property);
  const listingDate = getListingDate(property);
  const thumbnail = getThumbnail(property);

  const statusColor =
    propertyCard.statusColors[status] || propertyCard.statusColors.default;

  return (
    <div
      className={`group relative ${propertyCard.layout.borderRadius} overflow-hidden bg-white transition-all duration-300 ${propertyCard.animation.hoverLift} hover:shadow-xl animate-fadeInUp`}
      style={{
        animationDelay: `${index * propertyCard.animation.staggerDelayMs}ms`,
        border: `1px solid ${colors.cardsBoarder}`,
      }}
    >
      {/* Click overlay */}
      {clicked && (
        <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: colors.primary }}
            />
            <span className="mt-2 text-sm" style={{ color: colors.body }}>
              Loading property…
            </span>
          </div>
        </div>
      )}

      <Link
        href={`/listing/${propertyKey}`}
        onClick={() => setClicked(true)}
        className={clicked ? "pointer-events-none" : ""}
      >
        {/* ── Image ── */}
        <div
          className={`relative ${propertyCard.layout.imageHeight} overflow-hidden`}
          style={{ backgroundColor: colors.cardsBoarder }}
        >
          {/* Spinner while loading */}
          {thumbnail && !imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: colors.primary }}
              />
            </div>
          )}

          {thumbnail ? (
            <img
              src={thumbnail}
              alt={`${type} in ${city}`}
              className={`w-full h-full object-cover transition-all duration-500 ${propertyCard.animation.hoverScale} ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center"
              style={{ backgroundColor: colors.boarder, color: colors.body }}
            >
              <div className="text-sm font-medium">
                {propertyCard.fallbackText.noImage}
              </div>
            </div>
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Top-left badge */}
          {variant === "new" && (
            <div className="absolute top-3 left-3 z-10">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-md"
                style={{
                  backgroundColor: propertyCard.badges.newListing.bgColor,
                  color: propertyCard.badges.newListing.textColor,
                }}
              >
                {propertyCard.badges.newListing.label}
              </span>
            </div>
          )}

          {/* Bottom-left status pill — glass effect */}
          <div className="absolute bottom-3 left-3 z-10">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
              style={{
                backgroundColor: `${statusColor}dd`,
                color: "#ffffff",
              }}
            >
              {status}
            </span>
          </div>

          {/* Bottom-right listing date */}
          {variant === "new" && (
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 text-white/90 text-xs">
              <Calendar className="w-3 h-3" />
              {listingDate}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-4">
          {/* Price */}
          <p
            className="text-xl font-bold mb-1"
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
                <span>{sqft.toLocaleString()} sqft</span>
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
      </Link>
    </div>
  );
}
