// app/(root)/listing/[id]/page.tsx
import React, { cache } from "react";
import { Metadata } from "next";
import { Home as HomeIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GalleryGateWrapper from "@/components/listing/GalleryGateWrapper";
import OverviewExcerpt from "@/components/listing/OverviewExcerpt";
import { ds } from "@/lib/design-system-utils";
import {
  fetchNearestSchools,
  fetchNearbyAmenities,
  fetchPropertyByKey,
  fetchListingCatalogStats,
  fetchPropertySnapshots,
  fetchCensusFsaProfile,
} from "@/lib/api";
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
import { MortgageCalculator } from "@/components/ui/MortgageCalculator";
import { CashflowCalculator } from "@/components/calculators/CashflowCalculator";
import ClosingCostsEstimator from "@/components/listing/details/ClosingCostsEstimator";
import ListingAmenitiesSection from "@/components/listing/details/ListingAmenitiesSection";
import ListingFeatureStatusSection from "@/components/listing/details/ListingFeatureStatusSection";
import {
  getAnnualTaxDisplayWithYear,
  getBathroomDisplayLabel,
  getLivingAreaSummary,
  getLotSizeSummary,
  getParkingSummary,
  getPropertyType,
  getTaxAnnualAmount,
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

/** One property fetch per request (shared by generateMetadata + page). */
const getCachedPropertyByKey = cache(fetchPropertyByKey);

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const id = (await params).id;
  const property = await getCachedPropertyByKey(id);

  if (!property) {
    return {
      title: "Property Not Found",
    };
  }

  const metaPriv = getListingIsPrivileged();
  const address =
    getDisplayAddress(property, { isPrivileged: metaPriv }) ||
    "Property Details";

  const description =
    property.public_remarks ||
    property.PublicRemarks ||
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
  const property = await getCachedPropertyByKey(params.id);

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
      : [];

  const getBedCount = () =>
    property.bedrooms_total || property.BedroomsTotal || null;
  const getBathCount = () =>
    property.bathrooms_total_integer || property.BathroomsTotalInteger || null;
  const getCity = () => getResolvedCity() || "N/A";

  const uiPropertyType = getPropertyType(property);
  // Normalizer sets all address/title fields to the listing_key as last resort,
  // so filter out purely-numeric values (those are listing IDs, not display text).
  const _nn = (v: unknown) => {
    const s = String(v ?? "").trim();
    return !s || /^\d+$/.test(s) ? "" : s;
  };
  const headline =
    _nn(property.project_name) ||
    _nn(property.property_title) ||
    _nn(property.title) ||
    _nn(property.unparsed_address) ||
    _nn(property.address) ||
    `${uiPropertyType}${cityForStats ? ` in ${cityForStats}` : ""}` ||
    "Listing";

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
    property.public_remarks ||
    property.PublicRemarks ||
    property.PrivateRemarks ||
    property.Description ||
    `This ${uiPropertyType} is located in ${getCity()}, ${property.StateOrProvince || "Ontario"}${builtYear ? `. Built in ${builtYear}` : ""}${beds || baths ? `, this property features ${beds ? `${beds} bedrooms` : ""}${beds && baths ? " and " : ""}${baths ? `${baths} bathrooms` : ""}` : ""}${livingArea ? ` with ${livingArea} of living space` : ""}.`;

  const quickFacts = [
    { label: t("lotSize"), value: getLotSizeSummary(property) },
    { label: t("parking"), value: getParkingSummary(property) },
    {
      label: t("annualTaxes"),
      value:
        getAnnualTaxDisplayWithYear(property) || getTaxAnnualAmount(property),
    },
  ].filter((item) => item.value);

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
      [nearestSchoolsData, nearbyAmenities] = await Promise.all([
        fetchNearestSchools(latitude, longitude, schoolRadiusMeters),
        fetchNearbyAmenities(latitude, longitude, 1800),
      ]);
    } catch (error) {
      console.error("Failed to fetch location data:", error);
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

        {propertyImages.length > 0 ? (
          <div className="mb-10">
            <GalleryGateWrapper
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
          <div className="w-full h-96 bg-ds-card border border-ds-card-border rounded-2xl flex items-center justify-center mb-10">
            <div className="text-center opacity-40">
              <HomeIcon className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">{t("noImages")}</p>
            </div>
          </div>
        )}

        <ListingExternalLinks property={property} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            <PropertyStats
              beds={beds || ""}
              baths={baths || ""}
              sqft={livingArea}
              type={uiPropertyType}
              year={builtYear || ""}
            />

            {quickFacts.length > 0 && (
              <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
                <h2 className={`${ds.h3} mb-4`}>{t("quickFacts")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {quickFacts.map((fact) => (
                    <div
                      key={fact.label}
                      className="rounded-xl border border-ds-card-border bg-ds-card/40 p-4"
                    >
                      <p className="text-xs uppercase tracking-wide text-ds-body mb-1">
                        {fact.label}
                      </p>
                      <p className="text-sm font-semibold text-ds-heading">
                        {fact.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
            <ListingFeatureStatusSection
              rows={[
                {
                  feature: "Structured gallery categories",
                  status: "Available",
                  dependency: "Local media metadata",
                },
                {
                  feature: "Nearby amenities",
                  status: "Available",
                  dependency: "OpenStreetMap Overpass (free)",
                },
                {
                  feature: "Live mortgage rates",
                  status: "Planned",
                  dependency: "External/public rate source",
                },
                {
                  feature: "Official school rankings",
                  status: "Partial",
                  dependency: "Bundled public dataset",
                },
              ]}
            />

            <section>
              <h2 className={`${ds.h3} mb-4`}>{t("aboutTitle")}</h2>
              <div className="bg-white rounded-2xl p-1">
                <OverviewExcerpt text={description} maxChars={400} />
              </div>
            </section>

            <ListingAISummary property={property} />

            <PropertyHistory history={history} />

            {/* Mortgage Calculator Section */}
            <section className="bg-white border border-ds-card-border rounded-2xl p-8 shadow-sm">
              <div className="max-w-3xl">
                <h2 className={`${ds.h3} mb-6 text-2xl`}>
                  {t("mortgageCalculatorTitle")}
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                  <div className="xl:col-span-2">
                    <MortgageCalculator
                      initialPrice={getMortgageInitialPrice(property, {
                        isPrivileged,
                      })}
                    />
                  </div>
                </div>
              </div>
            </section>

            <ClosingCostsEstimator
              price={currentListNumeric > 0 ? currentListNumeric : null}
            />

            <section className="bg-white border border-ds-card-border rounded-2xl p-8 shadow-sm">
              <h2 className={`${ds.h3} mb-4 text-2xl`}>
                {t("cashFlowEstimatorTitle")}
              </h2>
              <p className="text-sm text-ds-body mb-6 max-w-3xl">
                {t("cashFlowDisclaimer")}
              </p>
              <CashflowCalculator {...cashflowInitials} />
            </section>

            <PropertyDetailsGrid
              property={property}
              price={displayPrice}
              type={uiPropertyType}
              livingArea={livingArea}
            />
          </div>

          <aside className="space-y-6">
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
