"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Loader2, Eye, Plus, Check, ImageIcon, Video } from "lucide-react";
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
        href={getDetailUrl(property)}
        onClick={() => {
          setClicked(true);
          addToHistory(property);
        }}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(property);
            }}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView?.(property);
            }}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/90 hover:bg-white shadow-lg active:scale-95 text-ds-heading opacity-0 group-hover:opacity-100"
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isCompared) {
                removeFromCompare(propertyKey);
              } else {
                addToCompare(property);
              }
            }}
            className={`absolute top-[56px] right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isCompared
                ? "bg-ds-primary text-white opacity-100"
                : "bg-white/90 hover:bg-white text-ds-heading opacity-0 group-hover:opacity-100"
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
      <div className="grid grid-cols-4 border-t border-gray-200/70 relative z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(property);
          }}
          className={`flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors hover:bg-gray-50 ${
            saved ? "text-purple-600" : "text-gray-400 hover:text-purple-500"
          }`}
        >
          <Heart className={`w-3 h-3 shrink-0 ${saved ? "fill-current" : ""}`} />
          <span className="truncate">Favourite</span>
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isCompared) {
              removeFromCompare(propertyKey);
            } else {
              addToCompare(property);
            }
          }}
          className={`flex items-center justify-center gap-1 py-2 text-[10px] font-medium border-l border-gray-200/70 transition-colors hover:bg-gray-50 ${
            isCompared ? "text-purple-600" : "text-gray-400 hover:text-purple-500"
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
          href={getDetailUrl(property)}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-gray-400 hover:text-purple-500 border-l border-gray-200/70 transition-colors hover:bg-gray-50"
        >
          <ImageIcon className="w-3 h-3 shrink-0" />
          <span className="truncate">Images</span>
        </Link>

        <Link
          href={getDetailUrl(property)}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-gray-400 hover:text-purple-500 border-l border-gray-200/70 transition-colors hover:bg-gray-50"
        >
          <Video className="w-3 h-3 shrink-0" />
          <span className="truncate">Videos</span>
        </Link>
      </div>
    </div>
  );
}
