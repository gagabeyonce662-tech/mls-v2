/**
 * Estate Listing Detail Page
 *
 * This is a server component that aggregates and displays all information for a specific property.
 * It handles:
 * - Core property data fetching with a real not-found state.
 * - SEO Metadata generation.
 * - Parallel fetching of market stats, school data, and demographics.
 * - Responsive UI layout with multiple specialized detail components.
 */

import { cache } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EstateHeroGallery from "@/components/listing/EstateHeroGallery";
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
import NearestSchoolsSection from "@/components/listing/details/NearestSchoolsSection";
import SimilarProperties from "@/components/listing/SimilarProperties";
import { PropertyViewerTracker } from "@/components/listing/PropertyViewerTracker";
import ListingCatalogStatsSection from "@/components/listing/details/ListingCatalogStatsSection";
import ListingDemographicsSection from "@/components/listing/details/ListingDemographicsSection";
import PropertyNotesPanel from "@/components/listing/details/PropertyNotesPanel";
import FinancialsPanel from "@/components/listing/details/FinancialsPanel";
import ListingAmenitiesSection from "@/components/listing/details/ListingAmenitiesSection";
import {
  getBathroomDisplayLabel,
  getBedroomDisplayLabel,
  getDescription,
  getLivingAreaSummary,
  getPhotos,
  getPropertySizeSummary,
  getPropertyType,
  postalToFsa,
} from "@/lib/propertyUtils";
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
import ListingFactsStrip from "@/components/listing/details/ListingFactsStrip";
import ListingSectionNav from "@/components/listing/details/ListingSectionNav";

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

// --- CONFIGURATION & CONSTANTS ---
export const dynamic = "force-dynamic";

const getEstateProperty = cache(async (id: string): Promise<Property | null> =>
  fetchEstatePropertyById(id),
);

/**
 * Dynamic Metadata Generation
 * Optimizes SEO and Social Sharing (OpenGraph/Twitter) for each property listing.
 */
export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const id = (await params).id;
  const property = await getEstateProperty(id);

  if (!property) {
    return {
      title: "Listing not found | Estate-4u",
      robots: { index: false, follow: false },
    };
  }

  const metaPriv = getListingIsPrivileged();
  const address =
    String(property.unparsed_address || property.address || "").trim() ||
    getDisplayAddress(property, { isPrivileged: metaPriv }) ||
    "Property Details";
  const rawCity = String(property.city || property.City || "").trim();
  const city = ["unknown city", "n/a"].includes(rawCity.toLowerCase())
    ? ""
    : rawCity;
  const description =
    getDescription(property) ||
    `View photos and property details for ${address} on Estate-4u.`;
  const images = getPhotos(property).filter(Boolean).slice(0, 5);

  return {
    title: `${address} | ${city ? `${city} Real Estate` : "Real Estate"}`,
    description: description.substring(0, 160),
    openGraph: {
      title: `${address} | Estate-4u`,
      description: description.substring(0, 160),
      ...(images.length > 0 ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${address} | Estate-4u`,
      description: description.substring(0, 160),
      ...(images[0] ? { images: [images[0]] } : {}),
    },
  };
}

export default async function ListingPage(props: ListingPageProps) {
  // --- 1. INITIAL DATA RESOLUTION ---
  // Resolves params and fetches core property data.
  const params = await props.params;
  const property = await getEstateProperty(params.id);

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
    property.listing_key || property.ListingKey || params.id,
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
  const propertyImages = getPhotos(property).filter(Boolean);

  const getBedCount = () =>
    property.bedrooms_total ?? property.BedroomsTotal ?? null;
  const getBathCount = () =>
    property.bathrooms_total_integer ?? property.BathroomsTotalInteger ?? null;
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
  const propertySize = livingArea || getPropertySizeSummary(property) || "";

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
    const unwrapped = Array.isArray(value) ? value[0] : value;
    if (typeof unwrapped === "boolean") return unwrapped;
    if (typeof unwrapped === "number") return unwrapped !== 0;
    if (typeof unwrapped === "string") {
      return ["1", "true", "yes", "y", "on"].includes(
        unwrapped.trim().toLowerCase(),
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
    (property as { video_url?: unknown }).video_url ??
      property.video_tour_url ??
      wpMeta.fave_video_url ??
      wpMeta.video_url ??
      "",
  ).trim();
  const wpTerms = parseJsonObject(
    (property as { wp_terms_json?: unknown }).wp_terms_json,
  );
  const formatTaxonomyValues = (value: unknown): string => {
    const rawValues = Array.isArray(value)
      ? value
      : String(value ?? "").split(",");
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
    formatTaxonomyValues(wpTerms.type || wpTerms.property_type) ||
    uiPropertyType;
  const statusTags = formatTaxonomyValues(
    wpTerms.status || wpTerms.property_status,
  )
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const directStatus = String(
    property.StandardStatus || property.standard_status || "",
  ).trim();
  const listingStatus =
    statusTags[0] ||
    (["publish", "published", "draft", "pending", "private"].includes(
      directStatus.toLowerCase(),
    )
      ? ""
      : directStatus);
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
    const unwrapped = Array.isArray(value) ? value[0] : value;
    if (typeof unwrapped === "number" && Number.isFinite(unwrapped)) {
      return unwrapped;
    }
    if (typeof unwrapped === "string") {
      const cleaned = unwrapped.trim().replace(/[^0-9.-]+/g, "");
      if (!cleaned || cleaned === "-" || cleaned === ".") return null;
      if (/^\d+(?:\.\d+)?-\d+(?:\.\d+)?$/.test(cleaned)) {
        const first = Number(cleaned.split("-")[0]);
        return Number.isFinite(first) ? first : null;
      }
      const parsed = Number(cleaned);
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
  const bedroomRange = formatRange(
    property.bedrooms_total ?? property.BedroomsTotal,
    property.max_bedrooms,
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
  const developerName = String(property.developer || "").trim();
  const listingFacts = [
    { label: "Home types", value: propertyTypeDetailsValue },
    { label: "Bedrooms", value: bedroomRange || String(beds || "").trim() },
    { label: "Size", value: propertySize },
    {
      label: "Occupancy",
      value: String(property.occupancy_year || property.occupancy || "").trim(),
    },
    {
      label: "Deposit",
      value: formatSignedCurrency(property.signing_amount) || "",
    },
    { label: "Developer", value: developerName },
  ].filter((item) => String(item.value || "").trim().length > 0);

  // --- 5. DESCRIPTION & COORDINATES PROCESSING ---
  const description =
    getDescription(property) ||
    property.PrivateRemarks ||
    property.Description ||
    `This ${uiPropertyType}${cityForStats ? ` is located in ${cityForStats}` : ""}${property.StateOrProvince || property.state_or_province ? `, ${property.StateOrProvince || property.state_or_province}` : ""}${builtYear ? `. Built in ${builtYear}` : ""}${beds || baths ? `, this property features ${beds ? `${beds} bedrooms` : ""}${beds && baths ? " and " : ""}${baths ? `${baths} bathrooms` : ""}` : ""}${livingArea ? ` with ${livingArea} of living space` : ""}.`;
  const aboutHtml = String(
    (property as { property_description?: string }).property_description ?? "",
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
          bodyHtml: String(typed.body_html ?? "").trim(),
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
    [nearestSchoolsData, nearbyAmenities] = await Promise.all([
      fetchNearestSchools(latitude, longitude, schoolRadiusMeters),
      fetchNearbyAmenities(latitude, longitude, 1800),
    ]);
    schoolFetchFailed = nearestSchoolsData === null;
  }

  // --- 7. RENDER LAYOUT ---
  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      {/* Navigation and Tracking */}
      <Header />
      <PropertyViewerTracker property={property} />

      <main className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8 animate-in fade-in duration-700">
        {/* Header Stats and Title */}
        <PropertyHeader
          headline={headline}
          propertyType={uiPropertyType}
          city={getCity()}
          address={displayAddress}
          status={listingStatus || undefined}
          price={displayPrice}
          developer={developerName || undefined}
          isFeaturedTag={isFeaturedTag}
          labelTags={labelTags}
          customTags={customTags}
          statusTags={statusTags}
          priceLabel="Starting from"
          rightActions={<ListingQuickActions property={property} compact />}
        />

        <EstateHeroGallery
          images={propertyImages}
          statusLabel={listingStatus || undefined}
          latitude={latitude}
          longitude={longitude}
          listingKey={listingKeyStr}
          tourUrl={
            property.virtual_tour_url ||
            property.VirtualTourURL ||
            property.video_tour_url ||
            null
          }
          videoUrl={videoUrl || null}
        />

        <div className="mt-5">
          <ListingFactsStrip facts={listingFacts} />
        </div>

        <div className="mt-5">
          <ListingSectionNav
            sections={[
              { id: "overview", label: "Overview" },
              { id: "documents", label: "Documents" },
              { id: "project-details", label: "Project details" },
              { id: "neighborhood", label: "Area" },
              { id: "calculator", label: "Calculator" },
            ]}
          />
        </div>

        {updatedOnLabel ? (
          <p className="mt-3 text-right text-xs font-medium text-slate-500">
            Listing updated {updatedOnLabel}
          </p>
        ) : null}

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
          <div className="min-w-0 space-y-10">
            {/* 1. Description — first thing after gallery */}
            <div id="overview" className="scroll-mt-32">
              {descriptionSections.length > 0 ? (
                <div className="space-y-8">
                  {descriptionSections.map((section) => (
                    <div key={section.id} className="space-y-2">
                      {section.title ? (
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                          {section.title}
                        </h2>
                      ) : null}
                      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.65)] sm:p-8">
                        <div
                          className="rich-text-content overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
                        />
                      </section>
                    </div>
                  ))}
                </div>
              ) : (
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.65)] sm:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-ds-heading mb-3">
                    {t("aboutTitle")}
                  </h2>
                  {aboutHtml ? (
                    <div
                      className="rich-text-content overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: aboutHtml }}
                    />
                  ) : (
                    <OverviewExcerpt text={description} maxChars={400} />
                  )}
                </section>
              )}
            </div>

            <div id="documents" className="scroll-mt-32">
              <EstateListingActionButtons property={property} />
            </div>

            {/* 3. Property Records — detailed specs early in the flow */}
            <section id="project-details" className="scroll-mt-32">
              <PropertyDetailsGrid
                property={property}
                price={displayPrice}
                type={uiPropertyType}
                livingArea={livingArea}
                title="Project Details"
                hiddenLabels={[
                  "Status",
                  "MLS® #",
                  "Coordinates",
                  "Publish Status",
                ]}
                hideZeroValueLabels={["Parking"]}
              />
            </section>

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

            <section id="neighborhood" className="scroll-mt-32 space-y-6">
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
            </section>

            <section id="calculator" className="scroll-mt-32">
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
            </section>
          </div>

          <aside className="space-y-6">
            <div className="lg:sticky lg:top-24">
              <PropertySidebar
                property={property}
                city={getCity()}
                showLocationMap={false}
                showSecondaryActions={false}
                title={`Interested in ${headline}?`}
                description="Get the latest price list, floor plans and current availability from our team."
                primaryActionLabel="Get price list & floor plans"
                showTrustPoints
              />
            </div>
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
