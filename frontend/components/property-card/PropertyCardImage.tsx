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

  const getImageName = (url: string): string => {
    try {
      const parsed = new URL(url, "https://placeholder.invalid");
      const segments = parsed.pathname.split("/").filter(Boolean);
      return decodeURIComponent(segments[segments.length - 1] || "");
    } catch {
      return "";
    }
  };

  // Extract from Utils (ensuring consistency)
  const thumbnail = getThumbnail(property);
  const city = getCity(property);
  const type = getPropertyType(property);
  const status = getStatus(property);
  const listingDate = getListingDate(property);
  const imageName = (() => {
    const primary =
      (property as any).image_filename ||
      ((property as any).image_names || [])[0] ||
      ((property as any).media || [])[0]?.image_filename ||
      ((property as any).Media || [])[0]?.image_filename ||
      "";
    if (typeof primary === "string" && primary.trim()) return primary.trim();
    return thumbnail ? getImageName(thumbnail) : "";
  })();

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

      {/* Top-left status pill */}
      <div className="absolute left-3 top-3 z-10">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
          style={{
            backgroundColor: `${statusColor}dd`,
            color: "#ffffff",
          }}
        >
          {status}
        </span>
      </div>

      {/* Top-right listing date */}
      {variant === "new" && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg bg-black/30 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md">
          <Calendar className="w-3 h-3" />
          {listingDate}
        </div>
      )}

      {imageName && (
        <div
          className="absolute left-3 bottom-3 z-10 max-w-[75%] truncate rounded-md bg-black/45 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm"
          title={imageName}
        >
          {imageName}
        </div>
      )}
    </div>
  );
}
