"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Loader2, Eye, Plus, Check, ArrowUpRight } from "lucide-react";
import { colors, propertyCard } from "@/config/design-system";
import type { Property } from "@/lib/api";
import { getPropertyKey, getDetailUrl } from "@/lib/propertyUtils";
import { PropertyCardImage } from "@/components/property-card/PropertyCardImage";
import { PropertyCardContent } from "@/components/property-card/PropertyCardContent";
import { usePrefetchProperty } from "@/hooks/react-query";
import { useWatched } from "@/contexts/WatchedContext";
import { useCompare } from "@/contexts/CompareContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PropertyCardProps {
  property: Property;
  variant?: "new" | "featured";
  index?: number;
  onQuickView?: (property: Property) => void;
}

export default function PropertyCard({
  property,
  variant = "featured",
  index = 0,
  onQuickView,
}: PropertyCardProps) {
  const [clicked, setClicked] = useState(false);
  const propertyKey = getPropertyKey(property);
  const prefetch = usePrefetchProperty();

  const { toggleFavorite, isFavorite, addToHistory } = useWatched();
  const { addToCompare, removeFromCompare, isPropertySelected } = useCompare();

  const saved = isFavorite(propertyKey);
  const isCompared = isPropertySelected(propertyKey);
  const detailUrl = getDetailUrl(property);

  const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property);
  };

  const handleToggleCompare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeFromCompare(propertyKey);
    } else {
      addToCompare(property);
    }
  };

  const handleQuickView = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(property);
  };

  return (
    <div
      className={`group relative ${propertyCard.layout.borderRadius} overflow-hidden bg-white transition-all duration-300 ${propertyCard.animation.hoverLift} hover:shadow-xl animate-fadeInUp`}
      style={{
        animationDelay: `${index * propertyCard.animation.staggerDelayMs}ms`,
        border: `1px solid ${colors.cardsBoarder}`,
      }}
      onMouseEnter={() => propertyKey && prefetch(propertyKey)}
    >
      <Link
        href={detailUrl}
        onClick={() => {
          setClicked(true);
          addToHistory(property);
          // #region agent log
          fetch("http://127.0.0.1:7349/ingest/3f08206e-1a73-4004-abc2-35f0c9af591f", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "db96a5",
            },
            body: JSON.stringify({
              sessionId: "db96a5",
              runId: "pre-fix",
              hypothesisId: "H1",
              location: "frontend/components/PropertyCard.tsx:55",
              message: "Property card navigation click payload",
              data: {
                listingKey: property.listing_key ?? property.ListingKey ?? null,
                propertyKey: property.PropertyKey ?? null,
                generatedKey: propertyKey,
                detailUrl,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
        }}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {/* Click overlay */}
        {clicked && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-2xl">
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

        {/* ── Image ── */}
        <PropertyCardImage property={property} variant={variant} />

        {/* ── Content ── */}
        <PropertyCardContent property={property} />
      </Link>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggleFavorite}
            aria-label={saved ? "Remove from favorites" : "Add to favorites"}
            className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-lg active:scale-95 ${
              saved
                ? "bg-red-500 text-white"
                : "bg-white/80 text-gray-600 hover:bg-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {saved ? "Remove from Favorites" : "Add to Favorites"}
        </TooltipContent>
      </Tooltip>

      {/* ── Quick View Button ── */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleQuickView}
            aria-label="Open quick view"
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/90 hover:bg-white shadow-lg active:scale-95 text-ds-heading opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"
          >
            <Eye className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">Quick View</TooltipContent>
      </Tooltip>

      {/* ── Compare Button ── */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggleCompare}
            aria-label={isCompared ? "Remove from compare" : "Add to compare"}
            className={`absolute top-[56px] right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isCompared
                ? "bg-ds-primary text-white opacity-100"
                : "bg-white/90 hover:bg-white text-ds-heading opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"
            }`}
            style={isCompared ? { backgroundColor: colors.primary } : {}}
          >
            {isCompared ? (
              <Check className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {isCompared ? "Remove from Compare" : "Compare"}
        </TooltipContent>
      </Tooltip>

      {/* ── Action Footer ── */}
      <div className="grid grid-cols-3 border-t border-gray-200/70 relative z-10 bg-white">
        <button
          onClick={handleToggleFavorite}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors hover:bg-gray-50 ${
            saved ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
          }`}
        >
          <Heart className={`w-3 h-3 shrink-0 ${saved ? "fill-current" : ""}`} />
          <span className="truncate">{saved ? "Saved" : "Save"}</span>
        </button>

        <button
          onClick={handleToggleCompare}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-l border-gray-200/70 transition-colors hover:bg-gray-50 ${
            isCompared ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
          }`}
        >
          {isCompared ? (
            <Check className="w-3 h-3 shrink-0" />
          ) : (
            <Plus className="w-3 h-3 shrink-0" />
          )}
          <span className="truncate">Compare</span>
        </button>

        <Link
          href={detailUrl}
          onClick={(e) => e.stopPropagation()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-gray-500 hover:text-purple-500 border-l border-gray-200/70 transition-colors hover:bg-gray-50"
        >
          <ArrowUpRight className="w-3 h-3 shrink-0" />
          <span className="truncate">View Details</span>
        </Link>
      </div>
    </div>
  );
}
