"use client";

import {
  Bath,
  Bed,
  Building2,
  CalendarDays,
  MapPin,
  Ruler,
} from "lucide-react";

import { colors } from "@/config/design-system";
import type { Property } from "@/lib/api";
import {
  formatPrice,
  getBathrooms,
  getBedrooms,
  getCity,
  getFullAddress,
  getListingDate,
  getPrice,
  getPropertyType,
  getProvince,
  getSqft,
} from "@/lib/propertyUtils";
import { cn } from "@/lib/utils";

interface PropertyCardContentProps {
  property: Property;
  showFooterDivider?: boolean;
  layoutMode?: "default" | "compact";
}

function getListingContact(property: Property): string {
  const record = property as Record<string, unknown>;

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
  ];

  for (const key of candidateKeys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "MLS verified listing";
}

function getInitials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "MLS";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getAreaLabel(value: unknown): string {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "Area n/a";
  }

  return `${numericValue.toLocaleString("en-CA", {
    maximumFractionDigits: 0,
  })} sq ft`;
}

export function PropertyCardContent({
  property,
  showFooterDivider = true,
  layoutMode = "default",
}: PropertyCardContentProps) {
  const record = property as Record<string, unknown>;

  const price = getPrice(property);
  const propertyType = getPropertyType(property);
  const bedrooms = getBedrooms(property);
  const bathrooms = getBathrooms(property);
  const squareFeet = getSqft(property);
  const city = getCity(property);
  const province = getProvince(property);
  const listedOn = getListingDate(property);
  const contact = getListingContact(property);

  const directAddress =
    typeof record.unparsed_address === "string"
      ? record.unparsed_address.trim()
      : "";

  const fullAddress = String(
    directAddress || getFullAddress(property) || "",
  ).trim();

  const projectName =
    typeof record.project_name === "string" ? record.project_name.trim() : "";

  const displayTitle =
    fullAddress || projectName || `${propertyType} in ${city || "Ontario"}`;

  const location = [city, province]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

  const initials = getInitials(contact);
  const isCompact = layoutMode === "compact";

  return (
    <div
      className={cn(
        "flex flex-1 flex-col p-4",
        isCompact ? "min-h-[220px]" : "min-h-[250px]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className="text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{
            color: price > 0 ? colors.primary : colors.body,
          }}
        >
          {formatPrice(price)}
        </p>

        <span
          className="max-w-[46%] truncate rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600"
          title={propertyType}
        >
          {propertyType}
        </span>
      </div>

      <h3
        className="mt-3 line-clamp-2 min-h-[48px] text-base font-bold leading-6 text-gray-950"
        title={displayTitle}
      >
        {displayTitle}
      </h3>

      {location && (
        <p
          className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500"
          title={location}
        >
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />

          <span className="truncate">{location}</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 divide-x divide-gray-200 rounded-xl bg-gray-50 px-2 py-3">
        <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 text-gray-700">
          <Bed className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />

          <span className="truncate text-xs font-semibold">
            {bedrooms || "—"} beds
          </span>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 text-gray-700">
          <Bath className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />

          <span className="truncate text-xs font-semibold">
            {bathrooms || "—"} baths
          </span>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 text-gray-700">
          <Ruler
            className="h-4 w-4 shrink-0 text-gray-500"
            aria-hidden="true"
          />

          <span
            className="truncate text-xs font-semibold"
            title={getAreaLabel(squareFeet)}
          >
            {getAreaLabel(squareFeet)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "mt-auto pt-4",
          showFooterDivider && "border-t border-gray-100",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: "#EEF2FF",
              color: colors.primary,
            }}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold text-gray-800"
              title={contact}
            >
              {contact}
            </p>

            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Listing representative
            </p>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Added {listedOn}
        </p>
      </div>
    </div>
  );
}
