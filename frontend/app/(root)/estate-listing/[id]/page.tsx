import React from "react";
import { Metadata } from "next";
import { Home as HomeIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyGalleryGrid from "@/components/listing/PropertyGalleryGrid";
import OverviewExcerpt from "@/components/listing/OverviewExcerpt";
import { ds } from "@/lib/design-system-utils";
import {
  fetchNearestSchools,
  fetchNearbyAmenities,
  fetchListingCatalogStats,
  fetchPropertySnapshots,
  fetchCensusFsaProfile,
} from "@/lib/api";
import { fetchEstatePropertyById } from "@/lib/api/properties";
import type { Property } from "@/lib/api";
import { notFound } from "next/navigation";

// Modular Detail Components
import PropertyHeader from "@/components/listing/details/PropertyHeader";
import PropertyStats from "@/components/listing/details/PropertyStats";
import PropertyHistory from "@/components/listing/details/PropertyHistory";
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
import {
  getBathroomDisplayLabel,
  getDescription,
  getGarageDisplayLabel,
  getLivingAreaSummary,
  getPropertyType,
  postalToFsa,
} from "@/lib/propertyUtils";
import ListingExternalLinks from "@/components/listing/ListingExternalLinks";
import {
  getCashflowInitialsFromProperty,
  getDisplayAddress,
  getDisplayPriceLabel,
  getListingIsPrivileged,
  getMortgageInitialPrice,
  getPropertyHistorySource,
} from "@/lib/listingDisplay";
import { getTranslations } from "next-intl/server";

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

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
  const params = await props.params;
  const property = FORCE_TEMP_ESTATE_LISTING
    ? getTemporaryEstateListing(params.id)
    : ((await fetchEstatePropertyById(params.id)) ??
      getTemporaryEstateListing(params.id));

  if (!property) {
    notFound();
  }

  const t = await getTranslations("Listing");

  const isPrivileged = getListingIsPrivileged();
  const displayPrice = getDisplayPriceLabel(property, { isPrivileged });
  const displayAddress = getDisplayAddress(property, { isPrivileged });
  const cashflowInitials = getCashflowInitialsFromProperty(property, {
    isPrivileged,
  });

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

  const [catalogStats, snapshots, census] = await Promise.all([
    fetchListingCatalogStats({
      city: cityForStats || undefined,
      fsa: fsa || undefined,
    }),
    fetchPropertySnapshots(listingKeyStr),
    fsa ? fetchCensusFsaProfile(fsa) : Promise.resolve(null),
  ]);

  // Data extraction helpers
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

  const currentHistoryRow = {
    date: property.ModificationTimestamp
      ? new Date(property.ModificationTimestamp).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Recent",
    event: property.StandardStatus || property.standard_status || "Listed",
    price: displayPrice,
    source: getPropertyHistorySource(property, { isPrivileged }),
  };

  const snapshotHistoryRows = [...snapshots]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map((s) => ({
      date: new Date(s.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      event: s.standard_status || "Catalog snapshot",
      price:
        s.list_price != null
          ? `$${Number(s.list_price).toLocaleString("en-US")}`
          : "—",
      source: "Our catalog sync history",
    }));

  const history =
    snapshotHistoryRows.length > 0
      ? [...snapshotHistoryRows, currentHistoryRow]
      : [currentHistoryRow];

  const currentListNumeric = getMortgageInitialPrice(property, {
    isPrivileged,
  });

  const beds = getBedCount();
  const baths =
    getBathroomDisplayLabel(property) ||
    (getBathCount() != null ? String(getBathCount()) : "");
  const builtYear = property.year_built || property.YearBuilt;

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

  return (
    <div className="min-h-screen bg-ds-background">
      <Header />
      <PropertyViewerTracker property={property} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
        <PropertyHeader
          headline={headline}
          propertyType={uiPropertyType}
          city={getCity()}
          address={displayAddress}
          status={
            property.StandardStatus || property.standard_status || "Active"
          }
          price={displayPrice}
        />

        <div className="mb-6">
          <PropertyStats
            beds={beds || ""}
            baths={baths || ""}
            sqft={livingArea}
            type={uiPropertyType}
            year={builtYear || ""}
            garages={getGarageDisplayLabel(property) || undefined}
            showPropertyType={false}
          />
        </div>

        {propertyImages.length > 0 ? (
          <div className="mb-6">
            <PropertyGalleryGrid
              images={propertyImages}
              media={property.media || property.Media || []}
              statusLabel="For Sale"
              tourUrl={
                property.virtual_tour_url ||
                property.VirtualTourURL ||
                property.video_tour_url ||
                null
              }
            />
          </div>
        ) : (
          <div className="w-full h-64 md:h-72 bg-ds-card border border-ds-card-border rounded-2xl flex items-center justify-center mb-10">
            <div className="text-center opacity-40">
              <HomeIcon className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">{t("noImages")}</p>
            </div>
          </div>
        )}

        <ListingExternalLinks property={property} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Description — first thing after gallery */}
            {descriptionSections.length > 0 ? (
              <div className="space-y-4">
                {descriptionSections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-ds-body mb-3">
                      {section.title || t("aboutTitle")}
                    </h4>
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
                <h2 className={`${ds.h3} mb-3`}>{t("aboutTitle")}</h2>
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

            {/* 2. AI summary */}
            <ListingAISummary property={property} />

            {/* 3. Property Records — detailed specs early in the flow */}
            <PropertyDetailsGrid
              property={property}
              price={displayPrice}
              type={uiPropertyType}
              livingArea={livingArea}
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

            {/* 4. Listing activity history */}
            <PropertyHistory history={history} />

            {/* 5. Neighborhood — collapsible to reduce scroll fatigue */}
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

            {/* 6. Financials — single tabbed panel replaces three stacked sections */}
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

          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <PropertySidebar property={property} city={getCity()} />
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
