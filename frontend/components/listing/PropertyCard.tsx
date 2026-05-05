"use client";

import React from "react";
import {
  Bed,
  Bath,
  Maximize,
  Home,
  Loader2,
  Heart,
  Plus,
  Check,
  Eye,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { colors } from "@/config/design-system";
import { useWatched } from "@/contexts/WatchedContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  onMouseEnter?: (propertyKey: string) => void;
  onCompare?: (property: any) => void;
  onQuickView?: (property: any) => void;
  onImageLoad?: (propertyKey: string) => void;
  onImageError?: (
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
  onCompare,
  onQuickView,
  onImageLoad,
  onImageError,
  formatPrice,
}: PropertyCardProps) => {
  const { toggleFavorite, isFavorite, addToHistory } = useWatched();
  const saved = isFavorite(propertyKey);
  const displayPrice = property.list_price || property.ListPrice || 0;
  const displayCity = property.city || property.City || "Unknown City";
  const displayPropertyType =
    property.property_sub_type ||
    property.PropertySubType ||
    property.PropertyType ||
    "Property";
  const bedCount = property.bedrooms_total || property.BedroomsTotal || 0;
  const bathCount =
    property.bathrooms_total_integer || property.BathroomsTotalInteger || 0;

  if (isLocked) {
    return (
      <div
        className={`bg-white rounded-xl shadow-md overflow-hidden block relative transition-all duration-300 ${cardLoaded ? "opacity-100 translate-y-0" : "opacity-70 translate-y-2"
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
            title={
              property.project_name ||
              `${displayPropertyType} in ${displayCity}`
            }
          >
            {property.project_name
              ? property.project_name
              : `${displayPropertyType} in ${displayCity}`}
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
      onMouseEnter={() => onMouseEnter?.(propertyKey)}
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all block cursor-pointer relative min-h-[300px] group ${isClicked ? "pointer-events-none" : ""
        } ${cardLoaded ? "opacity-100 translate-y-0" : "opacity-70 translate-y-2"
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
        {/* Favorite Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(property);
              }}
              className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/90 hover:bg-white shadow-md active:scale-90 ${saved ? "text-red-500 scale-105" : "text-gray-400 hover:text-red-400"
                }`}
            >
              <Heart className={`w-4.5 h-4.5 ${saved ? "fill-current" : ""}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {saved ? "Remove from Favorites" : "Add to Favorites"}
          </TooltipContent>
        </Tooltip>

        {/* Compare Button */}
        {onCompare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare(property);
                }}
                className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/90 shadow-md active:scale-95 text-ds-heading ${isSelected
                    ? "text-blue-600 bg-white"
                    : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-white"
                  }`}
                aria-label={isSelected ? "Remove from Compare" : "Add to Compare"}
                title={isSelected ? "Remove from Compare" : "Add to Compare"}
              >
                {isSelected ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isSelected ? "Remove from Compare" : "Add to Compare"}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Quick View Button */}
        {onQuickView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(property);
                }}
                className="absolute bottom-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/90 shadow-md active:scale-95 text-ds-heading opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-white"
                aria-label="Quick View"
                title="Quick View"
              >
                <Eye className="w-4.5 h-4.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Quick View</TooltipContent>
          </Tooltip>
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
            className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            loading="lazy"
            onLoad={() => onImageLoad?.(propertyKey)}
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
          title={
            property.project_name || `${displayPropertyType} in ${displayCity}`
          }
        >
          {property.project_name
            ? property.project_name
            : `${displayPropertyType} in ${displayCity}`}
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
