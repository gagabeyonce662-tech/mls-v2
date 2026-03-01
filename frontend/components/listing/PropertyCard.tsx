"use client";

import React from "react";
import { Bed, Bath, Maximize, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { colors } from "@/config/design-system";

interface PropertyCardProps {
  property: any;
  propertyKey: string;
  isLoggedIn: boolean;
  isLocked: boolean;
  isSelected: boolean;
  imageUrl: string | null;
  imageLoaded: boolean;
  cardLoaded: boolean;
  isClicked: boolean;
  onCardClick: (property: any) => void;
  onMouseEnter: (propertyKey: string) => void;
  onImageLoad: (propertyKey: string) => void;
  onImageError: (
    propertyKey: string,
    e: React.SyntheticEvent<HTMLImageElement>,
  ) => void;
  formatPrice: (price: any) => string;
}

export const PropertyCard = ({
  property,
  propertyKey,
  isLoggedIn,
  isLocked,
  isSelected,
  imageUrl,
  imageLoaded,
  cardLoaded,
  isClicked,
  onCardClick,
  onMouseEnter,
  onImageLoad,
  onImageError,
  formatPrice,
}: PropertyCardProps) => {
  const displayPrice = property.list_price || property.ListPrice || 0;
  const displayCity = property.city || property.City || "Unknown City";
  const displayPropertyType =
    property.category_type || property.PropertySubType || "Property";
  const bedCount = property.bedrooms_total || property.BedroomsTotal || 0;
  const bathCount =
    property.bathrooms_total_integer || property.BathroomsTotalInteger || 0;

  if (isLocked) {
    return (
      <div
        className={`bg-white rounded-xl shadow-md overflow-hidden block relative transition-all duration-300 ${
          cardLoaded ? "opacity-100 translate-y-0" : "opacity-70 translate-y-2"
        }`}
        style={{
          animation: cardLoaded ? "fadeInUp 0.3s ease-out forwards" : "none",
        }}
      >
        <div className="relative h-48 flex items-center justify-center overflow-hidden">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={`Property in ${displayCity}`}
              width={320}
              height={192}
              className="w-full h-full object-cover filter blur-md scale-105"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <div className="text-white font-semibold">
                Login to view details
              </div>
              <div className="mt-2 flex gap-3 justify-center">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 bg-white rounded-lg font-medium hover:bg-gray-100"
                  style={{ color: colors.primary }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3
            className="font-semibold mb-1 truncate"
            style={{ color: colors.heading }}
          >
            {displayPropertyType} in {displayCity}
          </h3>
          <p
            className="text-lg font-bold mb-3"
            style={{ color: colors.primary }}
          >
            {formatPrice(displayPrice)}
          </p>
          <div
            className="flex items-center gap-4 text-sm"
            style={{ color: colors.body }}
          >
            {bedCount > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{bedCount}</span>
              </div>
            )}
            {bathCount > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{bathCount}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              <span className="text-xs">{property.StateOrProvince}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onCardClick(property)}
      onMouseEnter={() => onMouseEnter(propertyKey)}
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all block cursor-pointer relative min-h-[300px] ${
        isClicked ? "pointer-events-none" : ""
      } ${
        cardLoaded ? "opacity-100 translate-y-0" : "opacity-70 translate-y-2"
      }`}
      style={{
        animation: cardLoaded ? "fadeInUp 0.3s ease-out forwards" : "none",
      }}
    >
      {/* Click Loading Overlay */}
      {isClicked && (
        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: colors.primary }}
            />
            <span className="mt-2 text-sm" style={{ color: colors.body }}>
              Loading...
            </span>
          </div>
        </div>
      )}

      {/* Image Section */}
      <div
        className="relative h-48 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: colors.boarder }}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
            ✓
          </div>
        )}

        {/* Image Loading State */}
        {imageUrl && !imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: colors.primary }}
            />
          </div>
        )}

        {/* Actual Image */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Property in ${displayCity}`}
            width={320}
            height={192}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => onImageLoad(propertyKey)}
            unoptimized
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center px-4"
            style={{ color: colors.body }}
          >
            <Home className="w-12 h-12 mb-2 opacity-30" />
            <div className="text-sm font-medium">No Image Available</div>
            <div className="text-xs mt-1">{displayCity}</div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3
          className="font-semibold mb-1 truncate"
          style={{ color: colors.heading }}
        >
          {displayPropertyType} in {displayCity}
        </h3>
        <p className="text-lg font-bold mb-3" style={{ color: colors.primary }}>
          {formatPrice(displayPrice)}
        </p>
        <div
          className="flex items-center gap-4 text-sm"
          style={{ color: colors.body }}
        >
          {bedCount > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{bedCount}</span>
            </div>
          )}
          {bathCount > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{bathCount}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4" />
            <span className="text-xs">{property.StateOrProvince || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
