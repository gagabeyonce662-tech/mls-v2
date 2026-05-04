"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";

import MapPropertyCard from "@/components/map/MapPropertyCard";
import { PropertyMarker } from "@/components/map/types";
import { getDetailUrl } from "@/lib/propertyUtils";
import { openInNewTab } from "@/lib/navigation/openInNewTab";

interface MobilePropertyBottomSheetProps {
  marker: PropertyMarker | null;
  onClose: () => void;
}

const ANIMATION_MS = 280;

export default function MobilePropertyBottomSheet({
  marker,
  onClose,
}: MobilePropertyBottomSheetProps) {
  const [open, setOpen] = useState(false);

  const requestClose = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => onClose(), ANIMATION_MS);
  }, [onClose]);

  // Slide in on mount of a new marker.
  useEffect(() => {
    if (!marker) {
      setOpen(false);
      return;
    }
    const id = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, [marker]);

  useEffect(() => {
    if (!marker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [marker, requestClose]);

  useEffect(() => {
    if (!marker) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [marker]);

  if (!marker) return null;

  const detailUrl = marker.raw ? getDetailUrl(marker.raw) : null;
  const canViewDetails = Boolean(detailUrl);

  const handleViewDetails = () => {
    if (detailUrl) openInNewTab(detailUrl);
  };

  return (
    <div
      className="fixed inset-0 z-[1100] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Property details"
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={requestClose}
        aria-hidden="true"
      />

      <div
        className={`absolute inset-x-0 bottom-0 transform rounded-t-2xl bg-white shadow-2xl transition-transform ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          transitionDuration: `${ANIMATION_MS}ms`,
          maxHeight: "85vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col" style={{ maxHeight: "85vh" }}>
          <div className="relative pt-2">
            <div
              className="mx-auto h-1.5 w-10 rounded-full bg-gray-300"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-ds-body shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1">
            <MapPropertyCard marker={marker} hidePrimaryCta />
          </div>

          {canViewDetails && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={handleViewDetails}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ds-primary px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary focus-visible:ring-offset-2"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                View Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
