// components/PropertyCard.tsx
// Reusable client-side property card component used to display
// individual listings with images, details, and actions.
//
// Supports user interactions including favorites, compare,
// quick view, and navigation to property details.
//
// Integrates watched and compare contexts for state management
// and prefetches property details on hover to improve perceived
// performance.
//
// Uses composable subcomponents (PropertyCardImage,
// PropertyCardContent) to keep presentation concerns separated.
"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  GitCompare,
  Heart,
  ImageIcon,
} from "lucide-react";
import { propertyCard } from "@/config/design-system";
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
  const prefetch = usePrefetchProperty();

  const { toggleFavorite, isFavorite, addToHistory } = useWatched();
  const { addToCompare, removeFromCompare, isPropertySelected } = useCompare();

  const saved = isFavorite(propertyKey);
  const isCompared = isPropertySelected(propertyKey);
  const detailUrl = getDetailUrl(property);
  const compactActions = layoutMode === "compact";
  const actionButtonSpacing = compactActions
    ? "h-10 flex-col gap-0 pt-0 pb-0.5"
    : "py-2.5 gap-1.5";
  const actionIconClass = compactActions
    ? "w-4 h-4 shrink-0"
    : "w-3 h-3 shrink-0";
  const actionLabelClass = compactActions
    ? "text-[10px] leading-none"
    : "truncate";

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
      className={`group relative h-full flex flex-col ${propertyCard.layout.borderRadius} overflow-hidden transition-all duration-300 ${propertyCard.animation.hoverLift} animate-fadeInUp`}
      style={{
        animationDelay: `${index * propertyCard.animation.staggerDelayMs}ms`,
        border: `1px solid ${propertyCard.surface.borderColor}`,
        backgroundColor: propertyCard.surface.cardBg,
        boxShadow: propertyCard.surface.shadow,
      }}
      onMouseEnter={() => propertyKey && prefetch(propertyKey)}
    >
      <Link
        href={detailUrl}
        onClick={() => addToHistory(property)}
        target="_blank"
        rel="noopener noreferrer"
        className="block flex-1"
      >
        {/* ── Image ── */}
        <PropertyCardImage property={property} variant={variant} />

        {/* ── Content ── */}
        <PropertyCardContent property={property} layoutMode={layoutMode} />
      </Link>

      <div className="relative z-10 grid grid-cols-4 bg-white">
        <button
          onClick={handleToggleFavorite}
          className={`flex items-center justify-center border-r text-xs font-medium transition-colors hover:bg-gray-50 ${actionButtonSpacing} ${
            saved ? "text-purple-600" : "text-gray-500"
          }`}
          aria-label={saved ? "Saved" : "Save"}
          title={saved ? "Saved" : "Save"}
          style={{ borderColor: propertyCard.surface.sectionDivider }}
        >
          <Heart className={`${actionIconClass} ${saved ? "fill-current" : ""}`} />
          <span className={actionLabelClass}>{saved ? "Saved" : "Save"}</span>
        </button>

        <button
          onClick={handleToggleCompare}
          className={`flex items-center justify-center border-r text-xs font-medium transition-colors hover:bg-gray-50 ${actionButtonSpacing} ${
            isCompared
              ? "text-purple-600"
              : "text-gray-500 hover:text-purple-500"
          }`}
          style={{ borderColor: propertyCard.surface.sectionDivider }}
          aria-label={isCompared ? "Remove from Compare" : "Add to Compare"}
          title={isCompared ? "Remove from Compare" : "Add to Compare"}
        >
          {isCompared ? (
            <Check className={actionIconClass} />
          ) : (
            <GitCompare className={actionIconClass} />
          )}
          <span className={actionLabelClass}>Compare</span>
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleQuickView}
              className={`flex items-center justify-center border-r text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-purple-500 ${actionButtonSpacing}`}
              style={{ borderColor: propertyCard.surface.sectionDivider }}
              aria-label="Images"
              title="Images"
            >
              <ImageIcon className={actionIconClass} />
              <span className={actionLabelClass}>Images</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Quick View Gallery</TooltipContent>
        </Tooltip>

        <Link
          href={detailUrl}
          onClick={(e) => e.stopPropagation()}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-purple-500 ${actionButtonSpacing}`}
          aria-label="View details"
          title="View details"
        >
          <ArrowUpRight className={actionIconClass} />
          <span className={actionLabelClass}>View</span>
        </Link>
      </div>
    </div>
  );
}
