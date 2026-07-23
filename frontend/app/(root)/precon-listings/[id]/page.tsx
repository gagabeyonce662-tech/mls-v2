"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  CalendarDays,
  Car,
  Check,
  Download,
  ExternalLink,
  Gift,
  House,
  MapPin,
  Navigation,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import EstateHeroGallery from "@/components/listing/EstateHeroGallery";
import PhoneVerifiedActionButton from "@/components/listing/PhoneVerifiedActionButton";
import { Button } from "@/components/ui/button";
import {
  fetchPreconProperty,
  type PreconPropertyDetail,
} from "@/lib/api/precon";

interface DepositInstallment {
  milestone: string;
  amount: string;
}

interface DepositPlan {
  title: string;
  installments: DepositInstallment[];
}

interface NearbyPlace {
  name: string;
  category: string;
  travel_time: string;
}

interface BuyerInformation {
  label: string;
  value: string;
}

interface HomeCollection {
  name: string;
  home_type: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  starting_price: string;
}

function parseStringArray(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [];
  }
}

function parseNearbyPlaces(value: string | undefined): NearbyPlace[] {
  if (!value?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is NearbyPlace =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as NearbyPlace).name === "string" &&
        typeof (item as NearbyPlace).category === "string" &&
        typeof (item as NearbyPlace).travel_time === "string",
    );
  } catch {
    return [];
  }
}

function parseBuyerInformation(value: string | undefined): BuyerInformation[] {
  if (!value?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is BuyerInformation =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as BuyerInformation).label === "string" &&
        typeof (item as BuyerInformation).value === "string",
    );
  } catch {
    return [];
  }
}

function parseHomeCollections(value: string | undefined): HomeCollection[] {
  if (!value?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is HomeCollection =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as HomeCollection).name === "string" &&
        typeof (item as HomeCollection).home_type === "string" &&
        typeof (item as HomeCollection).bedrooms === "string" &&
        typeof (item as HomeCollection).bathrooms === "string" &&
        typeof (item as HomeCollection).area === "string" &&
        typeof (item as HomeCollection).starting_price === "string",
    );
  } catch {
    return [];
  }
}

function parseDepositPlans(value: string | undefined): DepositPlan[] {
  if (!value?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (plan): plan is DepositPlan =>
        typeof plan === "object" &&
        plan !== null &&
        typeof (plan as DepositPlan).title === "string" &&
        Array.isArray((plan as DepositPlan).installments),
    );
  } catch {
    return [];
  }
}

function formatPrice(value: string | null): string {
  if (!value) {
    return "Contact for pricing";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Contact for pricing";
  }

  return number.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

function formatNumber(
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number % 1 === 0
    ? number.toLocaleString("en-CA")
    : number.toLocaleString("en-CA", {
        maximumFractionDigits: 1,
      });
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function splitMetaValue(
  value: string | undefined,
  separator: string | RegExp,
): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatRange(
  minimum: string | undefined,
  maximum: string | undefined,
  fallback: string | number | null | undefined,
): string | null {
  const min = formatNumber(minimum);
  const max = formatNumber(maximum);

  if (min && max) {
    return min === max ? min : `${min}–${max}`;
  }

  return min || max || formatNumber(fallback);
}

function getOverviewHtml(body: string): string {
  if (!body.trim()) {
    return "";
  }

  const structuredSectionPattern =
    /<h[2-6][^>]*>\s*(Project Highlights|Deposit Structure|Purchaser Incentives|Location and Amenities)/i;

  const match = structuredSectionPattern.exec(body);

  if (!match || match.index <= 0) {
    return body;
  }

  return body.slice(0, match.index).trim();
}

export default function PreconDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<PreconPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const property = await fetchPreconProperty(id);
      setData(property);
    } catch (loadError: unknown) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load property.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const imageAttachments =
    data?.attachments.filter((attachment) =>
      attachment.mime_type?.startsWith("image/"),
    ) ?? [];

  const documentAttachments =
    data?.attachments.filter(
      (attachment) => !attachment.mime_type?.startsWith("image/"),
    ) ?? [];

  const images = imageAttachments.map((attachment) => attachment.url);

  const developer =
    data?.meta.developer?.trim() || "Developer information coming soon";

  const occupancyYear = data?.meta.occupancy_year?.trim() || "To be announced";

  const propertyTypes = splitMetaValue(data?.meta.property_types, ",");

  const incentives = splitMetaValue(data?.meta.incentives, "|");

  const amenities = splitMetaValue(data?.meta.amenities, "|");

  const depositPlans = parseDepositPlans(data?.meta.deposit_plans_json);

  const communityHighlights = parseStringArray(
    data?.meta.community_highlights_json,
  );

  const interiorFeatures = parseStringArray(data?.meta.interior_features_json);

  const exteriorFeatures = parseStringArray(data?.meta.exterior_features_json);

  const nearbyPlaces = parseNearbyPlaces(data?.meta.nearby_places_json);

  const buyerInformation = parseBuyerInformation(
    data?.meta.buyer_information_json,
  );

  const homeCollections = parseHomeCollections(
    data?.meta.home_collections_json,
  );

  const purchaseNotes = parseStringArray(data?.meta.purchase_notes_json);

  const fallbackDepositSteps = splitMetaValue(
    data?.meta.deposit_structure,
    ";",
  );
  const bedroomRange = data
    ? formatRange(data.meta.bedrooms_min, data.meta.bedrooms_max, data.bedrooms)
    : null;

  const bathroomRange = data
    ? formatRange(
        data.meta.bathrooms_min,
        data.meta.bathrooms_max,
        data.bathrooms,
      )
    : null;

  const areaRange = data
    ? formatRange(data.meta.area_min, data.meta.area_max, data.area)
    : null;

  const garageCount = data
    ? formatNumber(data.meta.garage_count || data.garages)
    : null;

  const lotSize = data ? formatNumber(data.lot_size) : null;

  const areaUnit = data?.meta.area_unit?.trim() || "sq. ft.";

  const priceDisplay =
    data?.meta.price_display?.trim() || formatPrice(data?.price ?? null);

  const floorPlanAttachment = documentAttachments.find((attachment) =>
    attachment.title.toLowerCase().includes("floor"),
  );

  const floorPlanUrl =
    data?.meta.floor_plan_url?.trim() || floorPlanAttachment?.url || null;

  const overviewHtml = data ? getOverviewHtml(data.body) : "";

  const publishedDate = formatDate(data?.published_at ?? null);

  const latitude = data?.latitude ? Number(data.latitude) : null;

  const longitude = data?.longitude ? Number(data.longitude) : null;

  const hasCoordinates =
    latitude !== null &&
    Number.isFinite(latitude) &&
    longitude !== null &&
    Number.isFinite(longitude);

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <title>
        {data?.meta.seo_title ||
          (data?.title
            ? `${data.title} | Estate-4u`
            : "Pre-Construction Listing | Estate-4u")}
      </title>

      <Header />

      <main className="flex-1 pb-20 pt-24">
        <Container>
          <Link
            href="/precon-listings"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>

          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : data ? (
            <>
              <section className="mb-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                  <div className="max-w-4xl">
                    <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-orange-600">
                      <Building2 className="h-4 w-4" />
                      Pre-Construction
                    </div>

                    <h1 className="text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                      {data.title || `Pre-construction property ${data.id}`}
                    </h1>

                    {data.address ? (
                      <p className="mt-4 flex items-start gap-2 text-base text-slate-600 sm:text-lg">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                        <span>{data.address}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                      Starting price
                    </p>

                    <p className="mt-1 text-2xl font-extrabold text-slate-950">
                      {priceDisplay}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Pricing and availability may change.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard
                    icon={<Building2 className="h-5 w-5" />}
                    label="Developer"
                    value={developer}
                  />

                  <SummaryCard
                    icon={<CalendarDays className="h-5 w-5" />}
                    label="Occupancy"
                    value={occupancyYear}
                  />

                  <SummaryCard
                    icon={<House className="h-5 w-5" />}
                    label="Home types"
                    value={
                      propertyTypes.length > 0
                        ? propertyTypes.join(", ")
                        : "Pre-construction homes"
                    }
                  />

                  <SummaryCard
                    icon={<ShieldCheck className="h-5 w-5" />}
                    label="Status"
                    value="Now selling"
                  />
                </div>
              </section>

              <EstateHeroGallery
                images={images}
                statusLabel="Pre-Construction"
                latitude={hasCoordinates ? latitude : null}
                longitude={hasCoordinates ? longitude : null}
                listingKey={String(data.id)}
              />

              <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-8">
                  <SectionCard
                    title="Property details"
                    icon={<House className="h-5 w-5" />}
                  >
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      <PropertyFact
                        icon={<Bed className="h-5 w-5" />}
                        label="Bedrooms"
                        value={bedroomRange}
                      />

                      <PropertyFact
                        icon={<Bath className="h-5 w-5" />}
                        label="Bathrooms"
                        value={bathroomRange}
                      />

                      <PropertyFact
                        icon={<Car className="h-5 w-5" />}
                        label="Garages"
                        value={garageCount}
                      />

                      <PropertyFact
                        icon={<Ruler className="h-5 w-5" />}
                        label="Interior area"
                        value={areaRange ? `${areaRange} ${areaUnit}` : null}
                      />

                      <PropertyFact
                        icon={<Navigation className="h-5 w-5" />}
                        label="Lot size"
                        value={lotSize}
                      />
                    </div>
                  </SectionCard>

                  {overviewHtml && (
                    <SectionCard
                      title="About the project"
                      icon={<Building2 className="h-5 w-5" />}
                    >
                      {overviewHtml ? (
                        <div
                          className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:text-slate-950 prose-p:leading-8"
                          dangerouslySetInnerHTML={{
                            __html: overviewHtml,
                          }}
                        />
                      ) : null}
                    </SectionCard>
                  )}

                  {(depositPlans.length > 0 ||
                    fallbackDepositSteps.length > 0) && (
                    <SectionCard
                      title="Deposit structures"
                      icon={<CalendarDays className="h-5 w-5" />}
                    >
                      {depositPlans.length > 0 ? (
                        <div className="space-y-3">
                          {depositPlans.map((plan, planIndex) => (
                            <details
                              key={plan.title}
                              open={planIndex === 0}
                              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                            >
                              <summary className="flex cursor-pointer list-none items-center justify-between bg-slate-50 px-5 py-4">
                                <h3 className="text-base font-extrabold text-slate-950">
                                  {plan.title}
                                </h3>

                                <span className="text-xl font-bold text-slate-500 transition group-open:rotate-45">
                                  +
                                </span>
                              </summary>

                              <div className="divide-y divide-slate-200 border-t border-slate-200">
                                {plan.installments.map((installment, index) => (
                                  <div
                                    key={`${plan.title}-${index}`}
                                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4"
                                  >
                                    <p className="text-sm font-medium text-slate-600">
                                      {installment.milestone}
                                    </p>

                                    <p className="text-right text-sm font-extrabold text-slate-950">
                                      {installment.amount}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                          {fallbackDepositSteps.map((step, index) => (
                            <div
                              key={`${step}-${index}`}
                              className="border-b border-slate-200 px-5 py-4 font-medium text-slate-700 last:border-b-0"
                            >
                              {step}
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  )}

                  {incentives.length > 0 && (
                    <SectionCard
                      title="Purchaser incentives"
                      icon={<Gift className="h-5 w-5" />}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {incentives.map((incentive) => (
                          <FeatureItem
                            key={incentive}
                            value={incentive}
                            variant="success"
                          />
                        ))}
                      </div>

                      <p className="mt-4 text-xs leading-5 text-slate-500">
                        Incentives are subject to availability and builder
                        terms.
                      </p>
                    </SectionCard>
                  )}

                  {amenities.length > 0 && (
                    <SectionCard
                      title="Amenities and location"
                      icon={<MapPin className="h-5 w-5" />}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {amenities.map((amenity) => (
                          <FeatureItem key={amenity} value={amenity} />
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {homeCollections.length > 0 && (
                    <SectionCard
                      title="Home collections"
                      icon={<House className="h-5 w-5" />}
                    >
                      <div className="grid gap-5 xl:grid-cols-2">
                        {homeCollections.map((collection) => (
                          <article
                            key={collection.name}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                          >
                            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-orange-600">
                                {collection.home_type}
                              </p>

                              <h3 className="mt-1 text-lg font-extrabold text-slate-950">
                                {collection.name}
                              </h3>
                            </div>

                            <dl className="grid grid-cols-2 gap-px bg-slate-200">
                              <CollectionDetail
                                label="Bedrooms"
                                value={collection.bedrooms}
                              />

                              <CollectionDetail
                                label="Bathrooms"
                                value={collection.bathrooms}
                              />

                              <CollectionDetail
                                label="Interior area"
                                value={collection.area}
                              />

                              <CollectionDetail
                                label="Starting price"
                                value={collection.starting_price}
                              />
                            </dl>
                          </article>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {buyerInformation.length > 0 && (
                    <SectionCard
                      title="Buyer information"
                      icon={<ShieldCheck className="h-5 w-5" />}
                    >
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {buyerInformation.map((item) => (
                          <div
                            key={item.label}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              {item.label}
                            </dt>

                            <dd className="mt-1 font-extrabold leading-6 text-slate-950">
                              {item.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </SectionCard>
                  )}

                  {communityHighlights.length > 0 && (
                    <SectionCard
                      title="Community highlights"
                      icon={<Sparkles className="h-5 w-5" />}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {communityHighlights.map((highlight) => (
                          <FeatureItem key={highlight} value={highlight} />
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {(interiorFeatures.length > 0 ||
                    exteriorFeatures.length > 0) && (
                    <SectionCard
                      title="Features and finishes"
                      icon={<Building2 className="h-5 w-5" />}
                    >
                      <div className="grid gap-8 lg:grid-cols-2">
                        {interiorFeatures.length > 0 && (
                          <div>
                            <h3 className="mb-4 text-lg font-extrabold text-slate-950">
                              Interior features
                            </h3>

                            <div className="space-y-3">
                              {interiorFeatures.map((feature) => (
                                <FeatureItem key={feature} value={feature} />
                              ))}
                            </div>
                          </div>
                        )}

                        {exteriorFeatures.length > 0 && (
                          <div>
                            <h3 className="mb-4 text-lg font-extrabold text-slate-950">
                              Exterior features
                            </h3>

                            <div className="space-y-3">
                              {exteriorFeatures.map((feature) => (
                                <FeatureItem key={feature} value={feature} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  )}

                  {nearbyPlaces.length > 0 && (
                    <SectionCard
                      title="Nearby places"
                      icon={<MapPin className="h-5 w-5" />}
                    >
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <div className="hidden grid-cols-[minmax(0,1fr)_180px_170px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 sm:grid">
                          <span>Destination</span>
                          <span>Category</span>
                          <span className="text-right">Travel time</span>
                        </div>

                        <div className="divide-y divide-slate-200">
                          {nearbyPlaces.map((place) => (
                            <div
                              key={`${place.name}-${place.category}`}
                              className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px_170px] sm:items-center sm:gap-4"
                            >
                              <p className="font-extrabold text-slate-950">
                                {place.name}
                              </p>

                              <p className="text-sm font-medium text-slate-600">
                                {place.category}
                              </p>

                              <p className="text-sm font-bold text-orange-700 sm:text-right">
                                {place.travel_time}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {purchaseNotes.length > 0 && (
                    <SectionCard
                      title="Important purchase notes"
                      icon={<ShieldCheck className="h-5 w-5" />}
                    >
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <ul className="space-y-3">
                          {purchaseNotes.map((note) => (
                            <li
                              key={note}
                              className="flex items-start gap-3 text-sm leading-6 text-amber-950"
                            >
                              <Check className="mt-1 h-4 w-4 shrink-0 text-amber-700" />
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </SectionCard>
                  )}

                  {imageAttachments.length > 0 && (
                    <SectionCard
                      title="Project gallery"
                      icon={<Sparkles className="h-5 w-5" />}
                    >
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {imageAttachments.map((attachment, index) => (
                          <div
                            key={attachment.id}
                            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={attachment.url}
                              alt={
                                attachment.title ||
                                `${data.title} image ${index + 1}`
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}
                </div>

                <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-600">
                      Interested in this project?
                    </p>

                    <h2 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950">
                      Get pricing and floor plans
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Ask about current releases, available models, deposit
                      requirements, and builder incentives.
                    </p>

                    <div className="mt-6 space-y-3">
                      {floorPlanUrl ? (
                        <PhoneVerifiedActionButton
                          onAccess={() =>
                            window.open(
                              floorPlanUrl,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ds-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                        >
                          <Download className="h-4 w-4" />
                          View floor plans
                        </PhoneVerifiedActionButton>
                      ) : null}

                      <Link
                        href="/contact"
                        className="flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                      >
                        Contact an agent
                      </Link>
                    </div>

                    <dl className="mt-6 space-y-4 border-t border-slate-200 pt-5">
                      <SidebarDetail label="Developer" value={developer} />

                      <SidebarDetail label="Occupancy" value={occupancyYear} />

                      <SidebarDetail
                        label="Starting price"
                        value={priceDisplay}
                      />
                    </dl>

                    {publishedDate ? (
                      <p className="mt-5 text-xs text-slate-500">
                        Listing published {publishedDate}
                      </p>
                    ) : null}
                  </div>

                  {googleMapsUrl ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                        <MapPin className="h-5 w-5" />
                      </div>

                      <h2 className="mt-4 text-lg font-extrabold text-slate-950">
                        Explore the location
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {data.address}
                      </p>

                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-ds-primary hover:underline"
                      >
                        Open in Google Maps
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ) : null}

                  {propertyTypes.length > 0 && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-extrabold text-slate-950">
                        Available home types
                      </h2>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {propertyTypes.map((type) => (
                          <span
                            key={type}
                            className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-ds-primary"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </aside>
              </section>
            </>
          ) : null}
        </Container>
      </main>

      <Footer />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" />

      <div className="h-[520px] animate-pulse rounded-3xl border border-slate-200 bg-slate-200" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
      <Building2 className="mx-auto h-12 w-12 text-slate-300" />

      <h2 className="mt-4 text-xl font-extrabold text-slate-950">
        Could not load this listing
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">{message}</p>

      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={onRetry}>Retry</Button>

        <Button variant="outline" asChild>
          <Link href="/precon-listings">Back to listings</Link>
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-1 line-clamp-2 font-extrabold leading-5 text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          {icon}
        </div>

        <h2 className="text-2xl font-extrabold text-slate-950">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function PropertyFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-orange-600">{icon}</div>

      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-extrabold text-slate-950">
        {value || "Contact us"}
      </p>
    </div>
  );
}

function FeatureItem({
  value,
  variant = "default",
}: {
  value: string;
  variant?: "default" | "success";
}) {
  const isSuccess = variant === "success";

  return (
    <div
      className={
        isSuccess
          ? "flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
          : "flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
      }
    >
      <div
        className={
          isSuccess
            ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
            : "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600"
        }
      >
        <Check className="h-3.5 w-3.5" />
      </div>

      <p
        className={
          isSuccess
            ? "font-semibold leading-6 text-emerald-950"
            : "font-medium leading-6 text-slate-700"
        }
      >
        {value}
      </p>
    </div>
  );
}

function CollectionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-extrabold leading-6 text-slate-950">
        {value || "Contact us"}
      </dd>
    </div>
  );
}

function SidebarDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 font-bold text-slate-950">{value}</dd>
    </div>
  );
}
