"use client";

import Link from "next/link";
import {
  Bath,
  Bed,
  Check,
  GitCompare,
  Heart,
  Images,
  MapPin,
  Ruler,
} from "lucide-react";

import { PropertyCardImage } from "@/components/property-card/PropertyCardImage";
import { useCompare } from "@/contexts/CompareContext";
import { useWatched } from "@/contexts/WatchedContext";
import type { Property } from "@/lib/api";
import {
  formatPrice,
  getBathrooms,
  getBedrooms,
  getCity,
  getDetailUrl,
  getFullAddress,
  getPrice,
  getPropertyKey,
  getPropertyType,
  getProvince,
  getSqft,
} from "@/lib/propertyUtils";
import { cn } from "@/lib/utils";

interface CompactPropertyCardProps {
  property: Property;
  index?: number;
  variant?: "new" | "featured";
  onQuickView?: (property: Property) => void;
}

function formatArea(value: unknown): string {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "—";
  }

  return numericValue.toLocaleString("en-CA", {
    maximumFractionDigits: 0,
  });
}

export function CompactPropertyCard({
  property,
  index = 0,
  variant = "featured",
  onQuickView,
}: CompactPropertyCardProps) {
  const propertyKey = getPropertyKey(property);
  const detailUrl = getDetailUrl(property);

  const { toggleFavorite, isFavorite, addToHistory } = useWatched();

  const { addToCompare, removeFromCompare, isPropertySelected } = useCompare();

  const saved = isFavorite(propertyKey);
  const compared = isPropertySelected(propertyKey);

  const price = getPrice(property);
  const address =
    getFullAddress(property) ||
    `${getPropertyType(property)} in ${getCity(property) || "Ontario"}`;

  const location = [getCity(property), getProvince(property)]
    .filter(Boolean)
    .join(", ");

  const bedrooms = getBedrooms(property);
  const bathrooms = getBathrooms(property);
  const squareFeet = getSqft(property);

  const handleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(property);
  };

  const handleCompare = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (compared) {
      removeFromCompare(propertyKey);
      return;
    }

    addToCompare(property);
  };

  const handleQuickView = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onQuickView?.(property);
  };

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl",
        "border border-gray-200 bg-white shadow-sm",
        "transition duration-300",
        "hover:-translate-y-1 hover:shadow-lg",
        "animate-fadeInUp",
      )}
      style={{
        animationDelay: `${Math.min(index, 8) * 35}ms`,
      }}
    >
      <div className="relative">
        <Link
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => addToHistory(property)}
          className="block"
        >
          <PropertyCardImage property={property} variant={variant} />
        </Link>

        <div className="absolute right-2.5 top-2.5 z-20 flex gap-2">
          <button
            type="button"
            onClick={handleFavorite}
            aria-label={
              saved ? "Remove from saved properties" : "Save property"
            }
            aria-pressed={saved}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center",
              "rounded-full border border-white/70 bg-white/95",
              "shadow-md backdrop-blur-sm transition",
              "hover:scale-105 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-blue-700",
              saved ? "text-red-600" : "text-gray-700 hover:text-red-600",
            )}
          >
            <Heart
              className={cn("h-4 w-4", saved && "fill-current")}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={handleCompare}
            aria-label={
              compared ? "Remove from comparison" : "Add to comparison"
            }
            aria-pressed={compared}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center",
              "rounded-full border border-white/70 bg-white/95",
              "shadow-md backdrop-blur-sm transition",
              "hover:scale-105 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-blue-700",
              compared ? "text-blue-800" : "text-gray-700 hover:text-blue-800",
            )}
          >
            {compared ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <GitCompare className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Link
        href={detailUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => addToHistory(property)}
        className="flex flex-1 flex-col p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xl font-extrabold tracking-tight text-[#1E3A8A]">
            {formatPrice(price)}
          </p>

          <span
            className="max-w-[45%] truncate rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600"
            title={getPropertyType(property)}
          >
            {getPropertyType(property)}
          </span>
        </div>

        <h3
          className="mt-3 line-clamp-2 min-h-12 text-sm font-bold leading-6 text-gray-950"
          title={address}
        >
          {address}
        </h3>

        {location && (
          <p
            className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500"
            title={location}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 divide-x divide-gray-200 rounded-xl bg-gray-50 py-2.5">
          <div className="flex min-w-0 items-center justify-center gap-1 px-1 text-xs font-semibold text-gray-700">
            <Bed
              className="h-3.5 w-3.5 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <span>{bedrooms || "—"}</span>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-1 px-1 text-xs font-semibold text-gray-700">
            <Bath
              className="h-3.5 w-3.5 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <span>{bathrooms || "—"}</span>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-1 px-1 text-xs font-semibold text-gray-700">
            <Ruler
              className="h-3.5 w-3.5 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <span className="truncate">{formatArea(squareFeet)}</span>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-[0.85fr_1.15fr] gap-2 border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={handleQuickView}
          disabled={!onQuickView}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-1.5",
            "rounded-xl border border-gray-200 px-2",
            "text-xs font-semibold text-gray-700 transition",
            "hover:border-blue-200 hover:bg-blue-50",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Images className="h-3.5 w-3.5" aria-hidden="true" />
          Photos
        </button>

        <Link
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => addToHistory(property)}
          className={cn(
            "inline-flex min-h-10 items-center justify-center",
            "rounded-xl bg-[#1E3A8A] px-3",
            "text-xs font-bold text-white transition",
            "hover:bg-[#172f70]",
          )}
        >
          View details
        </Link>
      </div>
    </article>
  );
}
