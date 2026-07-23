"use client";

import Link from "next/link";
import { ArrowUpRight, Check, GitCompare, Heart, Images } from "lucide-react";

import { propertyCard } from "@/config/design-system";
import type { Property } from "@/lib/api";
import { getDetailUrl, getPropertyKey } from "@/lib/propertyUtils";
import { PropertyCardImage } from "@/components/property-card/PropertyCardImage";
import { PropertyCardContent } from "@/components/property-card/PropertyCardContent";
import { usePrefetchProperty } from "@/hooks/react-query";
import { useWatched } from "@/contexts/WatchedContext";
import { useCompare } from "@/contexts/CompareContext";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  variant?: "new" | "featured";
  layoutMode?: "default" | "compact";
  index?: number;
  onQuickView?: (property: Property) => void;
}

export default function PropertyCard({
  property,
  variant = "featured",
  layoutMode = "default",
  index = 0,
  onQuickView,
}: PropertyCardProps) {
  const propertyKey = getPropertyKey(property);
  const detailUrl = getDetailUrl(property);
  const prefetch = usePrefetchProperty();

  const { toggleFavorite, isFavorite, addToHistory } = useWatched();

  const { addToCompare, removeFromCompare, isPropertySelected } = useCompare();

  const saved = isFavorite(propertyKey);
  const compared = isPropertySelected(propertyKey);
  const isCompact = layoutMode === "compact";

  const handleToggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(property);
  };

  const handleToggleCompare = (event: React.MouseEvent<HTMLButtonElement>) => {
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

  const recordHistory = () => {
    addToHistory(property);
  };

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white",
        "transition duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-xl",
        "animate-fadeInUp",
      )}
      style={{
        animationDelay: `${
          Math.min(index, 12) * propertyCard.animation.staggerDelayMs
        }ms`,
        borderColor: propertyCard.surface.borderColor,
        boxShadow: propertyCard.surface.shadow,
      }}
      onMouseEnter={() => {
        if (propertyKey) {
          prefetch(propertyKey);
        }
      }}
    >
      <div className="relative">
        <Link
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={recordHistory}
          aria-label="Open property details"
          className="block"
        >
          <PropertyCardImage property={property} variant={variant} />
        </Link>

        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={
              saved ? "Remove from saved properties" : "Save property"
            }
            aria-pressed={saved}
            title={saved ? "Remove from saved properties" : "Save property"}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full",
              "border border-white/70 bg-white/95 shadow-md backdrop-blur-sm",
              "transition hover:scale-105 hover:bg-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700",
              saved ? "text-red-600" : "text-gray-700 hover:text-red-600",
            )}
          >
            <Heart
              className={cn("h-4.5 w-4.5", saved && "fill-current")}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={handleToggleCompare}
            aria-label={
              compared
                ? "Remove property from comparison"
                : "Add property to comparison"
            }
            aria-pressed={compared}
            title={compared ? "Remove from comparison" : "Add to comparison"}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full",
              "border border-white/70 bg-white/95 shadow-md backdrop-blur-sm",
              "transition hover:scale-105 hover:bg-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700",
              compared
                ? "bg-blue-50 text-blue-800"
                : "text-gray-700 hover:text-blue-800",
            )}
          >
            {compared ? (
              <Check className="h-4.5 w-4.5" aria-hidden="true" />
            ) : (
              <GitCompare className="h-4.5 w-4.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Link
        href={detailUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={recordHistory}
        className="flex flex-1 flex-col"
      >
        <PropertyCardContent
          property={property}
          layoutMode={layoutMode}
          showFooterDivider={false}
        />
      </Link>

      <div
        className={cn(
          "grid gap-2 border-t border-gray-100 bg-white p-3",
          isCompact ? "grid-cols-[0.8fr_1.2fr]" : "grid-cols-[1fr_1.5fr]",
        )}
      >
        <button
          type="button"
          onClick={handleQuickView}
          disabled={!onQuickView}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl",
            "border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700",
            "transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900",
            "disabled:cursor-not-allowed disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700",
          )}
        >
          <Images className="h-4 w-4 shrink-0" aria-hidden="true" />

          <span>Photos</span>
        </button>

        <Link
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={recordHistory}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl",
            "bg-[#1E3A8A] px-4 text-sm font-bold text-white",
            "transition hover:bg-[#172f70]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700",
            "focus-visible:ring-offset-2",
          )}
        >
          <span>View details</span>

          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
