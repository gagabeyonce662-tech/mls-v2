/**
 * Estate Listing Detail Page
 *
 * This is a server component that aggregates and displays all information for a specific property.
 * It handles:
 * - Core property data fetching with fallback support.
 * - SEO Metadata generation.
 * - Parallel fetching of market stats, school data, and demographics.
 * - Responsive UI layout with multiple specialized detail components.
 */

import React from "react";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyMediaShowcase from "@/components/listing/PropertyMediaShowcase";
import OverviewExcerpt from "@/components/listing/OverviewExcerpt";
import {
  fetchNearestSchools,
  fetchNearbyAmenities,
  fetchListingCatalogStats,
  fetchCensusFsaProfile,
} from "@/lib/api";
import { fetchEstatePropertyById } from "@/lib/api/properties";
import type { Property } from "@/lib/api";
import { notFound } from "next/navigation";

// --- UI COMPONENT IMPORTS ---
import PropertyHeader from "@/components/listing/details/PropertyHeader";
import PropertyDetailsGrid from "@/components/listing/details/PropertyDetailsGrid";
import PropertySidebar from "@/components/listing/details/PropertySidebar";
import ListingAISummary from "@/components/listing/details/ListingAISummary";
import NearestSchoolsSection from "../../../../components/listing/details/NearestSchoolsSection";
import SimilarProperties from "@/components/listing/SimilarProperties";
import { PropertyViewerTracker } from "@/components/listing/PropertyViewerTracker";
import ListingCatalogStatsSection from "@/components/listing/details/ListingCatalogStatsSection";
import ListingEngagementMeter from "@/components/listing/details/ListingEngagementMeter";
import ListingDemographicsSection from "@/components/listing/details/ListingDemographicsSection";
import PropertyNotesPanel from "@/components/listing/details/PropertyNotesPanel";
import FinancialsPanel from "@/components/listing/details/FinancialsPanel";
import ListingAmenitiesSection from "@/components/listing/details/ListingAmenitiesSection";
import { CalendarDays } from "lucide-react";
import {
  getBathroomDisplayLabel,
  getBedroomDisplayLabel,
  getDescription,
  getLivingAreaSummary,
  getPropertySizeSummary,
  getPropertyType,
  postalToFsa,
} from "@/lib/propertyUtils";
import ListingExternalLinks from "@/components/listing/ListingExternalLinks";
import EstateListingActionButtons from "@/components/listing/EstateListingActionButtons";
import {
  getCashflowInitialsFromProperty,
  getDisplayAddress,
  getDisplayPriceLabel,
  getListingIsPrivileged,
  getMortgageInitialPrice,
} from "@/lib/listingDisplay";
import { getTranslations } from "next-intl/server";
import ListingQuickActions from "@/components/listing/details/ListingQuickActions";

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

// --- CONFIGURATION & CONSTANTS ---
export const dynamic = "force-dynamic";
const FORCE_TEMP_ESTATE_LISTING = false;
const TEMP_ESTATE_SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80";

// TEMPORARY: hardcoded fallback while estate backend data path is being stabilized.
// Remove this once estate detail API is fully reliable.
function getTemporaryEstateListing(id: string): Property {
  const key = String(id || "estate_1");
  const cleanId = key.replace(/^estate_/i, "") || "1";
  return {
    id: cleanId,
    listing_key: `estate_${cleanId}`,
    ListingKey: `estate_${cleanId}`,
    PropertyKey: `estate_${cleanId}`,
    listing_id: `EST-${cleanId}`,
    project_name: "Lakeview Residences",
    property_title: "Lakeview Residences",
    property_sub_type: "Condo",
    PropertySubType: "Condo",
    city: "Toronto",
    City: "Toronto",
    state_or_province: "ON",
    StateOrProvince: "ON",
    unparsed_address: "120 Queens Quay E, Toronto, ON",
    postal_code: "M5A 1B6",
    standard_status: "For Sale",
    StandardStatus: "For Sale",
    list_price: 2000000,
    ListPrice: 2000000,
    bedrooms_total: 3,
    BedroomsTotal: 3,
    bathrooms_total_integer: 2,
    BathroomsTotalInteger: 2,
    building_area_total: 1650,
    year_built: 2026,
    developer: "Estate4u Development Group",
    occupancy_year: 2027,
    tax_annual_amount: 8400,
    tax_year: 2026,
    lot_size_dimensions: "32 x 95",
    featured_image_url: TEMP_ESTATE_SAMPLE_IMAGE,
    media: [
      {
        media_url: TEMP_ESTATE_SAMPLE_IMAGE,
        media_category: "Property Photo",
        is_preferred: true,
        order: 1,
      },
    ],
    Media: [
      {
        media_url: TEMP_ESTATE_SAMPLE_IMAGE,
        media_category: "Property Photo",
        is_preferred: true,
        order: 1,
      },
    ],
    public_remarks:
      "Temporary hardcoded estate listing for UI validation while backend mapping is finalized.",
    property_description:
      "<p>Temporary hardcoded estate listing for UI validation while backend mapping is finalized.</p>",
    description_sections_json: [
      {
        id: "legacy-overview",
        title: "Overview",
        body_html:
          "<p>Temporary hardcoded estate listing for UI validation while backend mapping is finalized.</p>",
        order: 0,
      },
    ],
    latitude: "43.6425",
    longitude: "-79.3684",
    ModificationTimestamp: new Date().toISOString(),
  };
}

/**
 * Dynamic Metadata Generation
 * Optimizes SEO and Social Sharing (OpenGraph/Twitter) for each property listing.
 */
export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const id = (await params).id;
  const property = FORCE_TEMP_ESTATE_LISTING
    ? getTemporaryEstateListing(id)
    : ((await fetchEstatePropertyById(id)) ?? getTemporaryEstateListing(id));

  const metaPriv = getListingIsPrivileged();
  const address =
    getDisplayAddress(property, { isPrivileged: metaPriv }) ||
    "Property Details";

  const description =
    getDescription(property) ||
    `Check out this property at ${address}. View photos, details and more on Estate-4u.`;

  const images =
    property.media && property.media.length > 0
      ? property.media
          .map((m: any) => m.media_url)
          .filter(Boolean)
          .slice(0, 5)
      : ["https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"];

  return {
    title: `${address} | Toronto Real Estate`,
    description: description.substring(0, 160),
    openGraph: {
      title: `${address} | Estate-4u`,
      description: description.substring(0, 160),
      images: images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${address} | Estate-4u`,
      description: description.substring(0, 160),
      images: images[0],
    },
  };
}

export default async function ListingPage(props: ListingPageProps) {
  // --- 1. INITIAL DATA RESOLUTION ---
  // Resolves params and fetches core property data.
  const params = await props.params;
  const property = FORCE_TEMP_ESTATE_LISTING
    ? getTemporaryEstateListing(params.id)
    : ((await fetchEstatePropertyById(params.id)) ??
      getTemporaryEstateListing(params.id));

  if (!property) {
    notFound();
  }

  // --- 2. LOCALIZATION & ACCESS CONTROL ---
  const t = await getTranslations("Listing");

  const isPrivileged = getListingIsPrivileged();
  const displayPrice = getDisplayPriceLabel(property, { isPrivileged });
  const displayAddress = String(
    property.unparsed_address ||
      property.address ||
      getDisplayAddress(property, { isPrivileged }) ||
      "",
  ).trim();
  const cashflowInitials = getCashflowInitialsFromProperty(property, {
    isPrivileged,
  });

  // --- 3. GEOGRAPHIC & MARKET ANALYTICS ---
  const getResolvedCity = () => {
    const rawCity = String(
      property.city || property.City || property.location || "",
    ).trim();
    if (!rawCity) return "";
    const normalized = rawCity.toLowerCase();
    if (normalized === "unknown city" || normalized === "n/a") return "";
    return rawCity;
  };
  const cityForStats = getResolvedCity();
  const postal =
    (property.postal_code as string | undefined) ||
    (property as { PostalCode?: string }).PostalCode ||
    "";
  const fsa = postalToFsa(postal);
  const listingKeyStr = String(
    property.listing_key || property.ListingKey || (await props.params).id,
  );

  const [catalogStats, census] = await Promise.all([
    fetchListingCatalogStats({
      city: cityForStats || undefined,
      fsa: fsa || undefined,
    }),
    fsa ? fetchCensusFsaProfile(fsa) : Promise.resolve(null),
  ]);

  // --- 4. UI DATA FORMATTING ---
  // Normalizes raw property data into display-ready labels and arrays.
  const propertyImages =
    property.media && property.media.length > 0
      ? property.media.map((m: any) => m.media_url).filter(Boolean)
      : [TEMP_ESTATE_SAMPLE_IMAGE];

  const getBedCount = () =>
    property.bedrooms_total || property.BedroomsTotal || null;
  const getBathCount = () =>
    property.bathrooms_total_integer || property.BathroomsTotalInteger || null;
  const getCity = () => getResolvedCity() || "N/A";

  const uiPropertyType = getPropertyType(property);
  const headline =
    String(
      property.project_name ||
        property.property_title ||
        property.title ||
        property.unparsed_address ||
        property.address ||
        `${uiPropertyType}${cityForStats ? ` in ${cityForStats}` : ""}`,
    ).trim() || "Listing";

  const livingArea = getLivingAreaSummary(property);
  const propertySize = getPropertySizeSummary(property) || livingArea;

  const currentListNumeric = getMortgageInitialPrice(property, {
    isPrivileged,
  });
  const parseJsonObject = (value: unknown): Record<string, unknown> => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    if (typeof value !== "string") return {};
    const text = value.trim();
    if (!text) return {};
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  };
  const parseBoolean = (value: unknown): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      return ["1", "true", "yes", "y", "on"].includes(
        value.trim().toLowerCase(),
      );
    }
    return false;
  };
  const parseCustomTags = (value: unknown): string[] => {
    const raw = Array.isArray(value)
      ? value.map((item) => {
          if (item && typeof item === "object") {
            const term = item as Record<string, unknown>;
            return String(term.name || term.label || term.value || "");
          }
          return String(item);
        })
      : String(value ?? "").split(/[,\n|]/g);
    const cleaned = raw
      .map((item) => item.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .filter((item) => item.toLowerCase() !== "featured");
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const tag of cleaned) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(tag);
    }
    return deduped;
  };
  const wpMeta = parseJsonObject(
    (property as { wp_meta_json?: unknown }).wp_meta_json,
  );
  const videoUrl = String(
    (property as { video_url?: unknown }).video_url ?? wpMeta.video_url ?? "",
  ).trim();
  const wpTerms = parseJsonObject(
    (property as { wp_terms_json?: unknown }).wp_terms_json,
  );
  const formatTaxonomyValues = (value: unknown): string => {
    const rawValues = Array.isArray(value) ? value : String(value ?? "").split(",");
    const cleaned = rawValues
      .map((item) => {
        if (item && typeof item === "object") {
          const term = item as Record<string, unknown>;
          return String(term.name || term.label || term.value || "").trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
    return Array.from(new Set(cleaned)).join(", ");
  };
  const propertyTypeDetailsValue =
    formatTaxonomyValues(wpTerms.type || wpTerms.property_type) || uiPropertyType;
  const statusTags = formatTaxonomyValues(wpTerms.status || wpTerms.property_status)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const isFeaturedTag = parseBoolean(
    (property as { is_featured?: unknown }).is_featured ??
      wpMeta.fave_featured ??
      wpMeta.is_featured,
  );
  const customTags = parseCustomTags(
    (property as { custom_tags?: unknown }).custom_tags ??
      wpMeta.custom_tags ??
      wpMeta.tags,
  );
  const labelTags = parseCustomTags(
    (property as { labels?: unknown }).labels ??
      (property as { property_label?: unknown }).property_label ??
      wpTerms.labels ??
      wpTerms.property_label,
  );

  const beds = getBedroomDisplayLabel(property) || getBedCount();
  const baths =
    getBathroomDisplayLabel(property) ||
    (getBathCount() != null ? String(getBathCount()) : "");
  const builtYear = property.year_built || property.YearBuilt;
  const parseNumericLike = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  const formatRange = (min: unknown, max: unknown): string | null => {
    const minNum = parseNumericLike(min);
    const maxNum = parseNumericLike(max);
    if (minNum === null && maxNum === null) return null;
    if (minNum !== null && maxNum !== null) {
      if (minNum === maxNum) return String(minNum);
      return `${minNum}-${maxNum}`;
    }
    return String(minNum ?? maxNum);
  };
  const formatSignedCurrency = (value: unknown): string | null => {
    const parsed = parseNumericLike(value);
    if (parsed === null) return null;
    return `$${parsed.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };
  const wpMetaMaxBathrooms = parseNumericLike(wpMeta.max_bathrooms);
  const wpMetaMaxGarages = parseNumericLike(wpMeta.max_garages);
  const bedroomRange = formatRange(
    property.bedrooms_total || property.BedroomsTotal,
    property.max_bedrooms,
  );
  const bathroomRange = formatRange(
    property.bathrooms_total_integer || property.BathroomsTotalInteger,
    property.max_bathrooms ?? wpMetaMaxBathrooms,
  );
  const garageRange = formatRange(
    property.garages,
    property.max_garages ?? wpMetaMaxGarages,
  );
  const updatedTimestamp = String(
    property.modification_timestamp ||
      property.ModificationTimestamp ||
      property.updated_at ||
      "",
  ).trim();
  const updatedOnLabel = (() => {
    if (!updatedTimestamp) return "";
    const parsed = new Date(updatedTimestamp);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  })();
  const detailsRows = [
    { label: "Price", value: displayPrice },
    { label: "Property Type", value: propertyTypeDetailsValue },
    { label: "Property Size", value: propertySize },
    { label: "Developer", value: String(property.developer || "").trim() },
    { label: "Bedrooms", value: bedroomRange || String(beds || "").trim() },
    {
      label: "Occupancy",
      value: String(property.occupancy_year || property.occupancy || "").trim(),
    },
    { label: "Bathrooms", value: bathroomRange || String(baths || "").trim() },
    {
      label: "Signing amount",
      value: formatSignedCurrency(property.signing_amount) || "",
    },
    { label: "Garages", value: garageRange || "" },
  ].filter((item) => String(item.value || "").trim().length > 0);

  // --- 5. DESCRIPTION & COORDINATES PROCESSING ---
  const description =
    getDescription(property) ||
    property.PrivateRemarks ||
    property.Description ||
    `This ${uiPropertyType} is located in ${getCity()}, ${property.StateOrProvince || "Ontario"}${builtYear ? `. Built in ${builtYear}` : ""}${beds || baths ? `, this property features ${beds ? `${beds} bedrooms` : ""}${beds && baths ? " and " : ""}${baths ? `${baths} bathrooms` : ""}` : ""}${livingArea ? ` with ${livingArea} of living space` : ""}.`;
  const aboutHtml = String(
    (property as { property_description?: string }).property_description || "",
  ).trim();
  const descriptionSections = (() => {
    const source = (property as { description_sections_json?: unknown })
      .description_sections_json;
    let raw: unknown[] = [];
    if (Array.isArray(source)) {
      raw = source;
    } else if (typeof source === "string") {
      try {
        const parsed = JSON.parse(source);
        if (Array.isArray(parsed)) raw = parsed;
      } catch {
        raw = [];
      }
    }
    return raw
      .map((item, idx) => {
        if (!item || typeof item !== "object") return null;
        const typed = item as Record<string, unknown>;
        return {
          id: String(typed.id || `section-${idx + 1}`),
          title: String(typed.title || "").trim(),
          bodyHtml: String(typed.body_html || "").trim(),
          order:
            typeof typed.order === "number"
              ? typed.order
              : Number.parseInt(String(typed.order ?? idx), 10) || idx,
        };
      })
      .filter(
        (
          section,
        ): section is {
          id: string;
          title: string;
          bodyHtml: string;
          order: number;
        } => Boolean(section && section.bodyHtml),
      )
      .sort((a, b) => a.order - b.order);
  })();

  const parseCoordinate = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const latitude = parseCoordinate(property.latitude);
  const longitude = parseCoordinate(property.longitude);
  const hasValidCoordinates =
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  // --- 6. EXTERNAL DATA (Schools & Amenities) ---
  const schoolRadiusMeters = 5000;
  let nearestSchoolsData: Awaited<ReturnType<typeof fetchNearestSchools>> =
    null;
  let nearbyAmenities: Awaited<ReturnType<typeof fetchNearbyAmenities>> = null;
  let schoolFetchFailed = false;

  if (hasValidCoordinates) {
    try {
      nearestSchoolsData = await fetchNearestSchools(
        latitude,
        longitude,
        schoolRadiusMeters,
      );
      nearbyAmenities = await fetchNearbyAmenities(latitude, longitude, 1800);
    } catch (error) {
      console.error("Failed to fetch nearest schools:", error);
      schoolFetchFailed = true;
    }
  }

  // --- 7. RENDER LAYOUT ---
  return (
    <div className="min-h-screen bg-ds-background">
      {/* Navigation and Tracking */}
      <Header />
      <PropertyViewerTracker property={property} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
        {/* Header Stats and Title */}
        <PropertyHeader
          headline={headline}
          propertyType={uiPropertyType}
          city={getCity()}
          address={displayAddress}
          status={
            property.StandardStatus || property.standard_status || "Active"
          }
          price={displayPrice}
          isFeaturedTag={isFeaturedTag}
          labelTags={labelTags}
          customTags={customTags}
          statusTags={statusTags}
          priceLabel="Price"
          priceClassName="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
          rightActions={<ListingQuickActions property={property} compact />}
        />

        <div className="mb-6">
          <PropertyMediaShowcase
            images={propertyImages}
            media={property.media || property.Media || []}
            statusLabel={
              isFeaturedTag
                ? "Featured"
                : String(
                    property.StandardStatus ||
                      property.standard_status ||
                      "For Sale",
                  )
            }
            latitude={latitude}
            longitude={longitude}
            city={getCity()}
            stateOrProvince={
              String(
                property.StateOrProvince || property.state_or_province || "",
              ).trim() || undefined
            }
            listingKey={listingKeyStr}
            tourUrl={
              property.virtual_tour_url ||
              property.VirtualTourURL ||
              property.video_tour_url ||
              null
            }
            videoUrl={videoUrl || null}
          />
        </div>

        <ListingExternalLinks property={property} />

        {/* Main Content Grid (2:1 Ratio) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Primary Details & History */}
            <section className="bg-white border border-ds-card-border rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                <h2 className="text-2xl font-bold text-ds-heading">Details</h2>
                {updatedOnLabel ? (
                  <p className="inline-flex items-center gap-2 text-sm text-ds-body">
                    <CalendarDays className="h-4 w-4 text-ds-body/80" />
                    Updated on {updatedOnLabel}
                  </p>
                ) : null}
              </div>
              <div className="rounded-lg border border-sky-500/70 bg-sky-100/70 p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  {detailsRows.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start justify-between gap-4 py-3 border-b border-sky-300/70"
                    >
                      <span className="font-semibold text-ds-heading">
                        {item.label}:
                      </span>
                      <span className="text-ds-heading text-right">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 1. Description — first thing after gallery */}
            {descriptionSections.length > 0 ? (
              <div className="space-y-6">
                {descriptionSections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    {section.title ? (
                      <h4 className="text-lg font-extrabold uppercase tracking-widest text-ds-body mb-3">
                        {section.title}
                      </h4>
                    ) : null}
                    <section className="bg-white border border-ds-card-border rounded-2xl p-5 shadow-sm">
                      <div
                        className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-1 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-a:text-ds-primary prose-a:underline"
                        dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
                      />
                    </section>
                  </div>
                ))}
              </div>
            ) : (
              <section className="bg-white border border-ds-card-border rounded-2xl p-5 shadow-sm">
                <h2 className="text-2xl md:text-3xl font-bold text-ds-heading mb-3">
                  {t("aboutTitle")}
                </h2>
                {aboutHtml ? (
                  <div
                    className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-1 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-a:text-ds-primary prose-a:underline"
                    dangerouslySetInnerHTML={{ __html: aboutHtml }}
                  />
                ) : (
                  <OverviewExcerpt text={description} maxChars={400} />
                )}
              </section>
            )}

            <EstateListingActionButtons property={property} />

            {/* 2. AI summary */}
            {/* <ListingAISummary property={property} /> */}

            {/* 3. Property Records — detailed specs early in the flow */}
            <PropertyDetailsGrid
              property={property}
              price={displayPrice}
              type={uiPropertyType}
              livingArea={livingArea}
              hiddenLabels={["Status", "MLS® #", "Coordinates", "Publish Status"]}
              hideZeroValueLabels={["Parking"]}
            />

            <ListingCatalogStatsSection
              stats={catalogStats}
              currentListPrice={
                currentListNumeric > 0 ? currentListNumeric : null
              }
              title={t("catalogStatsTitle")}
            />

            <ListingDemographicsSection
              fsa={fsa}
              profile={census?.profile ?? null}
              headingPrefix={t("demographicsTitle")}
            />

            {/* 4. Neighborhood — collapsible to reduce scroll fatigue */}
            <NearestSchoolsSection
              schools={nearestSchoolsData?.nearest_schools || []}
              radiusMeters={
                nearestSchoolsData?.search_radius_m || schoolRadiusMeters
              }
              hasCoordinates={hasValidCoordinates}
              isUnavailable={
                schoolFetchFailed ||
                (!nearestSchoolsData && hasValidCoordinates)
              }
            />
            <ListingAmenitiesSection amenities={nearbyAmenities} />

            {/* 5. Financials — single tabbed panel replaces three stacked sections */}
            <FinancialsPanel
              mortgageInitialPrice={getMortgageInitialPrice(property, {
                isPrivileged,
              })}
              closingCostsPrice={
                currentListNumeric > 0 ? currentListNumeric : null
              }
              cashflowInitials={cashflowInitials}
              cashflowDisclaimer={t("cashFlowDisclaimer")}
              mortgageTitle={t("mortgageCalculatorTitle")}
            />
          </div>

          {/* Sidebar Section (Sticky on desktop) */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <PropertySidebar
              property={property}
              city={getCity()}
              showLocationMap={false}
              showSecondaryActions={false}
            />
            <ListingEngagementMeter
              listingKey={listingKeyStr}
              title={t("engagementTitle")}
            />
            <PropertyNotesPanel
              listingKey={listingKeyStr}
              title={t("myNotesTitle")}
            />
          </aside>
        </div>

        {/* Similar Properties Section */}
        <SimilarProperties
          property={property}
          sectionTitle={t("similarProperties")}
        />
      </main>

      <Footer />
    </div>
  );
}
