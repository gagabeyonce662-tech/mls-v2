"use client";

import { useEffect, useState } from "react";
import { Columns, Check, Heart, Share2 } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { useWatched } from "@/contexts/WatchedContext";
import { getDetailUrl } from "@/lib/propertyUtils";
import {
  getDisplayAddress,
  getListingIsPrivileged,
} from "@/lib/listingDisplay";
import { cn } from "@/lib/utils";

interface ListingQuickActionsProps {
  property: any;
  className?: string;
  compact?: boolean;
}

export default function ListingQuickActions({
  property,
  className,
  compact = false,
}: ListingQuickActionsProps) {
  const {
    addToCompare,
    removeFromCompare,
    isPropertySelected,
    getPropertyKey,
  } = useCompare();
  const { toggleFavorite, isFavorite } = useWatched();

  const propertyKey = getPropertyKey(property);
  const isSelected = isPropertySelected(propertyKey);
  const isSaved = isFavorite(propertyKey);
  const [shareStatus, setShareStatus] = useState<"" | "copied" | "shared" | "failed">("");

  const handleShare = async () => {
    const detailUrl = getDetailUrl(property);
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${detailUrl}`
        : detailUrl;
    const shareAddress = getDisplayAddress(property, {
      isPrivileged: getListingIsPrivileged(),
    });
    const shareTitle = `${shareAddress} | Estate-4u`;
    const shareText = "Check out this property on Estate-4u.";

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus("shared");
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("copied");
        return;
      }

      if (typeof window !== "undefined") {
        window.prompt("Copy this link:", shareUrl);
        setShareStatus("copied");
        return;
      }

      setShareStatus("failed");
    } catch (error) {
      console.error("Share failed", error);
      setShareStatus("failed");
    }
  };

  useEffect(() => {
    if (!shareStatus) return;
    const timer = window.setTimeout(() => setShareStatus(""), 2500);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <button
          onClick={() =>
            isSelected ? removeFromCompare(propertyKey) : addToCompare(property)
          }
          className={cn(
            "flex-1 flex flex-col items-center justify-center border rounded-xl transition-all",
            compact ? "py-2 text-[10px]" : "py-2.5 text-[10px]",
            isSelected
              ? "bg-blue-50 border-blue-200 text-blue-700 shadow-inner"
              : "bg-white border-ds-card-border text-ds-body/90 hover:bg-gray-50 shadow-sm",
          )}
        >
          {isSelected ? (
            <Check className="w-4 h-4 mb-1" />
          ) : (
            <Columns className="w-4 h-4 mb-1" />
          )}
          <span className="font-bold">{isSelected ? "Added" : "Compare"}</span>
        </button>

        <button
          onClick={() => toggleFavorite(property)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center border rounded-xl transition-all",
            compact ? "py-2 text-[10px]" : "py-2.5 text-[10px]",
            isSaved
              ? "bg-red-50 border-red-200 text-red-600 shadow-inner"
              : "bg-white border-ds-card-border text-ds-body/90 hover:bg-gray-50 shadow-sm",
          )}
        >
          <Heart className={cn("w-4 h-4 mb-1", isSaved ? "fill-current" : "")} />
          <span className="font-bold">{isSaved ? "Saved" : "Save"}</span>
        </button>

        <button
          onClick={handleShare}
          aria-label="Share listing"
          className={cn(
            "flex-1 flex flex-col items-center justify-center bg-white border border-ds-card-border rounded-xl text-ds-body/90 hover:bg-gray-50 shadow-sm transition-all",
            compact ? "py-2 text-[10px]" : "py-2.5 text-[10px]",
          )}
        >
          <Share2 className="w-4 h-4 mb-1" />
          <span className="font-bold">Share</span>
        </button>
      </div>

      {shareStatus ? (
        <p className="text-[11px] text-ds-body text-right">
          {shareStatus === "shared"
            ? "Shared successfully."
            : shareStatus === "copied"
              ? "Link copied to clipboard."
              : "Could not share right now."}
        </p>
      ) : null}
    </div>
  );
}
