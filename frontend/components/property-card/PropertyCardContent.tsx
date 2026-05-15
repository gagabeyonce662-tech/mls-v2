"use client";

import { Bed, Bath, CalendarDays, MapPin, Ruler } from "lucide-react";
import { colors, propertyCard } from "@/config/design-system";
import {
  getBathrooms,
  getBedrooms,
  getCity,
  getDescription,
  getFullAddress,
  getListingDate,
  getPrice,
  getPropertyType,
  getProvince,
  getSqft,
  formatPrice,
} from "@/lib/propertyUtils";
import type { Property } from "@/lib/api";

interface PropertyCardContentProps {
  property: Property;
  showFooterDivider?: boolean;
  layoutMode?: "default" | "compact";
}

const getListingContact = (property: Property): string => {
  const candidateKeys = [
    "list_agent_full_name",
    "ListAgentFullName",
    "list_agent_name",
    "ListAgentName",
    "co_list_agent_full_name",
    "CoListAgentFullName",
    "list_office_name",
    "ListOfficeName",
    "brokerage_name",
    "BrokerageName",
  ] as const;

  for (const key of candidateKeys) {
    const value = (property as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "MLS Verified Listing";
};

const getInitials = (value: string): string => {
  const parts = value.split(" ").filter(Boolean);
  if (parts.length === 0) return "ML";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export function PropertyCardContent({
  property,
  showFooterDivider = true,
  layoutMode = "default",
}: PropertyCardContentProps) {
  const price = getPrice(property);
  const type = getPropertyType(property);
  const beds = getBedrooms(property);
  const baths = getBathrooms(property);
  const address = getFullAddress(property);
  const sqft = getSqft(property);
  const city = getCity(property);
  const province = getProvince(property);
  const description = getDescription(property);
  const listedOn = getListingDate(property);
  const contact = getListingContact(property);
  const initials = getInitials(contact);
  const isCompact = layoutMode === "compact";
  const hasAddress = Boolean(address);

  return (
    <div
      className={`${propertyCard.layout.contentPadding} flex flex-col ${isCompact ? "min-h-[190px]" : ""}`}
    >
      <h3
        className={`${propertyCard.typography.title} ${isCompact ? "line-clamp-1" : "truncate"}`}
        style={{ color: colors.heading }}
        title={property.project_name || `${type} in ${city}`}
      >
        {property.project_name ? property.project_name : `${type} in ${city}`}
      </h3>

      <p
        className={`${propertyCard.typography.address} mt-2 flex items-start gap-1.5 ${isCompact ? "line-clamp-2 min-h-[32px]" : "line-clamp-1"}`}
        style={{ color: colors.body }}
        title={address || undefined}
      >
        <MapPin className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${hasAddress ? "opacity-100" : "opacity-0"}`} />
        <span className={hasAddress ? "opacity-100" : "opacity-0"}>
          {address || "Address unavailable"}
        </span>
      </p>

      <p
        className={`${propertyCard.typography.addedDate} mt-1 flex items-center gap-1.5`}
        style={{ color: colors.bodyLight }}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Added: {listedOn}
      </p>

      {!isCompact && description && (
        <p
          className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-3"
          title={description}
        >
          {description}
        </p>
      )}

      <div className="mt-2 grid grid-cols-3 items-center gap-2 min-h-[20px]" style={{ color: colors.body }}>
        <div className="flex items-center gap-1.5">
          <Bed className="h-3.5 w-3.5" />
          <span className={propertyCard.typography.stat}>{beds || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Bath className="h-3.5 w-3.5" />
          <span className={propertyCard.typography.stat}>{baths || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Ruler className="h-3.5 w-3.5" />
          <span className={`${propertyCard.typography.stat} truncate`}>
            {sqft ? `${sqft.toLocaleString("en-US")} sq ft` : province || "N/A"}
          </span>
        </div>
      </div>

      {isCompact ? <div className="mt-2" /> : <div className="mt-2 flex-1" />}

      <div
        className={`${isCompact ? "my-2" : "my-3"} border-t`}
        style={{ borderColor: propertyCard.surface.sectionDivider }}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: "#efeafc", color: colors.primary }}
          >
            {initials}
          </div>
          <span
            className="truncate text-sm font-semibold"
            style={{ color: colors.heading }}
            title={contact}
          >
            {contact}
          </span>
        </div>
        <p
          className={propertyCard.typography.price}
          style={{ color: price > 0 ? colors.primary : colors.body }}
        >
          {formatPrice(price)}
        </p>
      </div>

      {showFooterDivider && (
        <div
          className="mt-3 border-t"
          style={{ borderColor: propertyCard.surface.sectionDivider }}
        />
      )}
    </div>
  );
}
