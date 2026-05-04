/**
 * Public vs privileged presentation for MLS listing pages (CREA / board display norms).
 * TODO: set isPrivileged from agent/session when auth exists.
 */

import type { Property } from "@/lib/api";

export type ListingDisplayOptions = {
  isPrivileged: boolean;
};

/** QA override: NEXT_PUBLIC_LISTING_DISPLAY_PRIVILEGED=true shows full address and withheld pricing. */
export function getListingIsPrivileged(): boolean {
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_LISTING_DISPLAY_PRIVILEGED === "true"
  ) {
    return true;
  }
  return false;
}

function parseListPrice(property: Property): number | null {
  const raw = property.list_price ?? property.ListPrice;
  if (raw === null || raw === undefined || raw === "") return null;
  const n =
    typeof raw === "string"
      ? parseFloat(String(raw).replace(/[^0-9.-]+/g, ""))
      : Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseMoney(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** True when a non-null list price exists (including 0). */
export function hasListPrice(property: Property): boolean {
  return parseListPrice(property) !== null;
}

/**
 * Anonymous: neighbourhood / city / province only (no street).
 * Privileged: street address when available.
 */
export function getDisplayAddress(
  property: Property,
  { isPrivileged }: ListingDisplayOptions,
): string {
  if (isPrivileged) {
    const full =
      property.unparsed_address ||
      `${property.address || ""} ${property.city || ""}`.trim();
    if (full) return full;
  }

  const city = property.city || property.City || "";
  const region = property.city_region || property.CityRegion || "";
  const prov =
    property.state_or_province ||
    property.StateOrProvince ||
    property.province ||
    "";

  const area = [region, city].filter(Boolean).join(" · ");
  if (area && prov) return `${area}, ${prov}`;
  if (area) return area;
  if (city && prov) return `${city}, ${prov}`;
  if (city) return city;
  return "Address not available";
}

/**
 * Header/list price line. Anonymous + no list price: never show rent/lease as substitute.
 */
export function getDisplayPriceLabel(
  property: Property,
  { isPrivileged }: ListingDisplayOptions,
): string {
  const list = parseListPrice(property);
  if (list !== null) {
    return `$${list.toLocaleString("en-US")}`;
  }
  if (isPrivileged) {
    const rent = parseMoney(property.total_actual_rent);
    const lease = parseMoney(property.lease_amount);
    if (rent !== null) return `$${rent.toLocaleString("en-US")}/month`;
    if (lease !== null) return `$${lease.toLocaleString("en-US")}`;
  }
  return "Price on request";
}

export function getMortgageInitialPrice(
  property: Property,
  { isPrivileged }: ListingDisplayOptions,
): number {
  const list = parseListPrice(property);
  if (list !== null && list > 0) return list;
  if (isPrivileged) {
    const rent = parseMoney(property.total_actual_rent);
    if (rent !== null && rent > 0) return rent;
    const lease = parseMoney(property.lease_amount);
    if (lease !== null && lease > 0) return lease;
  }
  return 0;
}

/** Defaults for listing-page cash flow estimator (tax from annual; rent from lease fields when present). */
export function getCashflowInitialsFromProperty(
  property: Property,
  { isPrivileged }: ListingDisplayOptions,
): {
  initialHomePrice: number;
  initialMonthlyRent: number;
  initialMonthlyPropertyTax: number;
  initialAnnualMaintenance?: number;
  initialOtherMonthly: number;
} {
  const home = getMortgageInitialPrice(property, { isPrivileged });
  const taxAnnual =
    parseMoney(
      (property as { tax_annual_amount?: unknown }).tax_annual_amount ??
        (property as { TaxAnnualAmount?: unknown }).TaxAnnualAmount,
    ) ?? 0;
  const monthlyTax = taxAnnual > 0 ? taxAnnual / 12 : 0;
  const rent =
    parseMoney(property.total_actual_rent) ??
    parseMoney(property.lease_amount) ??
    0;
  const insurancePlaceholder = 0;
  return {
    initialHomePrice: home,
    initialMonthlyRent: rent,
    initialMonthlyPropertyTax: monthlyTax,
    initialAnnualMaintenance: undefined,
    initialOtherMonthly: insurancePlaceholder,
  };
}

/** Monthly rent line for rental detail UI; null = hide row (withheld for anonymous). */
export function getDisplayMonthlyRentLabel(
  property: Property,
  { isPrivileged }: ListingDisplayOptions,
): string | null {
  if (!isPrivileged && parseListPrice(property) === null) return null;
  const rent = parseMoney(property.total_actual_rent);
  if (rent === null) return null;
  return `$${rent.toLocaleString("en-US")}/month`;
}

export function shouldShowMonthlyRentRow(
  property: Property,
  isPrivileged: boolean,
): boolean {
  if (parseMoney(property.total_actual_rent) === null) return false;
  if (isPrivileged) return true;
  return parseListPrice(property) !== null;
}

/** Property History table source column: no internal ListingKey for anonymous users. */
export function getPropertyHistorySource(
  property: Property,
  { isPrivileged }: ListingDisplayOptions,
): string {
  if (isPrivileged) {
    const lid = property.listing_id || (property as { ListingId?: string }).ListingId;
    const lk = property.listing_key || property.ListingKey;
    if (lid) return `MLS® # ${lid}`;
    if (lk) return `MLS® # ${lk}`;
  }
  return "MLS® listing";
}

/** Consumer MLS® number for detail grids; optional second line for privileged. */
export function getMlsNumberForDisplay(
  property: Property,
  { isPrivileged }: ListingDisplayOptions,
): string | null {
  const lid = property.listing_id || (property as { ListingId?: string }).ListingId;
  const lk = property.listing_key || property.ListingKey;
  if (isPrivileged) {
    if (lid) return String(lid);
    if (lk) return String(lk);
    return null;
  }
  if (lid) return String(lid);
  return null;
}
