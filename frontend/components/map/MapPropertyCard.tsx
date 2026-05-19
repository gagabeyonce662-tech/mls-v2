"use client";

import React, { useMemo, useState } from "react";
import {
  ExternalLink,
  Heart,
  ImageOff,
  MapPin,
} from "lucide-react";

import { PropertyMarker } from "@/components/map/types";
import { useWatched } from "@/contexts/WatchedContext";
import { formatPrice, openStreetView } from "@/lib/helpers";
import { openInNewTab } from "@/lib/navigation/openInNewTab";
import { getCity, getDetailUrl, getThumbnail } from "@/lib/propertyUtils";

interface MapPropertyCardProps {
  marker: PropertyMarker;
  /** Tighter spacing + smaller image, intended for the desktop Leaflet popup. */
  compact?: boolean;
  /** When true, do not render the inline View Details button (sheet uses a sticky footer instead). */
  hidePrimaryCta?: boolean;
  onViewDetails?: () => void;
  onStreetView?: () => void;
}

function formatBuildingArea(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num)} sqft`;
}

export default function MapPropertyCard({
  marker,
  compact = false,
  hidePrimaryCta = false,
  onViewDetails,
  onStreetView,
}: MapPropertyCardProps) {
  const property = marker.raw;
  const { toggleFavorite, isFavorite, getPropertyKey } = useWatched();
  const propertyKey = property ? getPropertyKey(property) : marker.id;
  const saved = isFavorite(propertyKey);

  const [imgFailed, setImgFailed] = useState(false);

  const thumbnail = useMemo(
    () => (property ? getThumbnail(property) : null),
    [property],
  );

  const addressLine = useMemo(() => {
    if (!property) return null;
    const direct =
      property.unparsed_address || property.address || property.location;
    if (direct && String(direct).trim()) return String(direct).trim();
    const city = getCity(property);
    const region = property.state_or_province || property.StateOrProvince;
    const composite = [city, region].filter(Boolean).join(", ");
    return composite || null;
  }, [property]);

  const beds =
    property?.bedrooms_total ??
    property?.BedroomsTotal ??
    null;
  const baths =
    property?.bathrooms_total_integer ??
    property?.BathroomsTotalInteger ??
    null;
  const subtype =
    property?.property_sub_type ||
    property?.PropertySubType ||
    property?.PropertyType ||
    null;
  const sqft = formatBuildingArea(
    property?.building_area_total ?? property?.LivingArea,
  );

  const chips = [
    beds !== null && beds !== "" ? `${beds} bd` : null,
    baths !== null && baths !== "" ? `${baths} ba` : null,
    subtype || null,
    sqft,
  ].filter(Boolean) as string[];

  const detailUrl = property ? getDetailUrl(property) : null;
  const canViewDetails = Boolean(detailUrl);

  const handleToggleSave: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!property) return;
    toggleFavorite(property);
  };

  const handleViewDetails: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails();
      return;
    }
    if (detailUrl) openInNewTab(detailUrl);
  };

  const handleStreetView: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStreetView) {
      onStreetView();
      return;
    }
    openStreetView(marker.lat, marker.lng);
  };

  const imageHeight = compact ? "h-32" : "h-40";
  const wrapperPadding = compact ? "p-3" : "p-4";
  const titleSize = compact ? "text-sm" : "text-base";
  const priceSize = compact ? "text-lg" : "text-xl";
  const altText = property
    ? `${getCity(property) || "Property"} listing photo`
    : "Property listing photo";

  return (
    <div
      className="w-full min-w-0 max-w-[18rem] overflow-hidden rounded-xl bg-white"
    >
      <div className={`relative w-full ${imageHeight} bg-gray-100`}>
        {thumbnail && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={altText}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400">
            {thumbnail ? (
              <ImageOff className="h-6 w-6" aria-hidden="true" />
            ) : (
              <MapPin className="h-6 w-6" aria-hidden="true" />
            )}
            <span className="text-[11px] font-medium">No photo</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={saved ? "Remove from saved" : "Save property"}
          aria-pressed={saved}
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ds-primary shadow-md backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary focus-visible:ring-offset-2"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${saved ? "fill-red-500 stroke-red-500" : ""
              }`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className={`flex flex-col gap-2 ${wrapperPadding}`}>
        <div className="min-w-0">
          <h3
            className={`font-bold text-ds-heading leading-tight line-clamp-1 ${titleSize}`}
            title={marker.title}
          >
            {marker.title}
          </h3>
          {addressLine && (
            <p
              className="mt-0.5 text-xs text-ds-body line-clamp-1"
              title={addressLine}
            >
              {addressLine}
            </p>
          )}
        </div>

        <p
          className={`font-extrabold text-ds-primary leading-none ${priceSize}`}
        >
          {formatPrice(marker.price)}
        </p>

        {chips.length > 0 && (
          <p className="text-xs text-ds-body line-clamp-1">
            {chips.map((chip, idx) => (
              <React.Fragment key={`${chip}-${idx}`}>
                {idx > 0 && (
                  <span className="mx-1.5 text-gray-300" aria-hidden="true">
                    &middot;
                  </span>
                )}
                <span className="font-medium text-ds-heading">{chip}</span>
              </React.Fragment>
            ))}
          </p>
        )}

        <div className="mt-1 flex flex-col gap-2">
          {!hidePrimaryCta && canViewDetails && (
            <button
              type="button"
              onClick={handleViewDetails}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ds-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary focus-visible:ring-offset-2"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              View Details
            </button>
          )}
          <button
            type="button"
            onClick={handleStreetView}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-ds-primary bg-white px-3 py-2 text-xs font-semibold text-ds-primary transition hover:bg-ds-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Google Street View
          </button>
        </div>
      </div>
    </div>
  );
}
