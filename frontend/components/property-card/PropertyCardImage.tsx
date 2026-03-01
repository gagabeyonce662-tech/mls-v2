"use client";

import { useState } from "react";
import Image from "next/image";

import { Loader2, Calendar } from "lucide-react";
import { colors, propertyCard } from "@/config/design-system";
import {
  getThumbnail,
  getCity,
  getPropertyType,
  getStatus,
  getListingDate,
} from "@/lib/propertyUtils";
import type { Property } from "@/lib/api";

interface PropertyCardImageProps {
  property: Property;
  variant?: "new" | "featured";
}

export function PropertyCardImage({
  property,
  variant = "featured",
}: PropertyCardImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract from Utils (ensuring consistency)
  const thumbnail = getThumbnail(property);
  const city = getCity(property);
  const type = getPropertyType(property);
  const status = getStatus(property);
  const listingDate = getListingDate(property);

  const statusColor =
    propertyCard.statusColors[status] || propertyCard.statusColors.default;

  return (
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
        <Image
          src={thumbnail}
          alt={`${type} in ${city}`}
          width={400}
          height={300}
          className={`w-full h-full object-cover transition-all duration-500 ${
            propertyCard.animation.hoverScale
          } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          unoptimized
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
  );
}
