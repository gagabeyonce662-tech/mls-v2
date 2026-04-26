// app/(root)/listing/[id]/page.tsx
import React from "react";
import { Metadata } from "next";
import { Home as HomeIcon } from "lucide-react";
import Header from "@/components/Header";
import Image from "next/image";

import Footer from "@/components/Footer";
import PropertyGalleryGrid from "@/components/listing/PropertyGalleryGrid";
import OverviewExcerpt from "@/components/listing/OverviewExcerpt";
import { ds } from "@/lib/design-system-utils";
import { fetchPropertyByKey } from "@/lib/api";
import { notFound } from "next/navigation";

// Modular Detail Components
import PropertyHeader from "@/components/listing/details/PropertyHeader";
import PropertyStats from "@/components/listing/details/PropertyStats";
import PropertyHistory from "@/components/listing/details/PropertyHistory";
import PropertyDetailsGrid from "@/components/listing/details/PropertyDetailsGrid";
import PropertySidebar from "@/components/listing/details/PropertySidebar";
import SimilarProperties from "@/components/listing/SimilarProperties";
import { PropertyViewerTracker } from "@/components/listing/PropertyViewerTracker";
import { MortgageCalculator } from "@/components/ui/MortgageCalculator";
import {
  getLotSizeSummary,
  getParkingSummary,
  getTaxAnnualAmount,
} from "@/lib/propertyUtils";

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const id = (await params).id;
  const property = await fetchPropertyByKey(id);

  if (!property) {
    return {
      title: "Property Not Found",
    };
  }

  const address =
    property.unparsed_address ||
    `${property.address || ""} ${property.city || ""}`.trim() ||
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
  const property = await fetchPropertyByKey(params.id);

  if (!property) {
    notFound();
  }

  // Data extraction helpers
  const propertyImages =
    property.media && property.media.length > 0
      ? property.media.map((m: any) => m.media_url).filter(Boolean)
      : [];

  const getPrice = () => {
    const price = property.list_price ?? property.ListPrice;
    if (!price && price !== 0) return "Price on request";

    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numericPrice)
      ? "Price on request"
      : `$${numericPrice.toLocaleString('en-US')}`;
  };

  const getBedCount = () =>
    property.bedrooms_total || property.BedroomsTotal || null;
  const getBathCount = () =>
    property.bathrooms_total_integer || property.BathroomsTotalInteger || null;
  const getCity = () => property.city || property.City || "N/A";
  const getAddress = () =>
    property.unparsed_address ||
    `${property.address || ""} ${property.city || ""}`.trim() ||
    "Address not available";

  const getPropertyType = () => {
    if (property.category_type) return property.category_type;
    if (property.PropertySubType) return property.PropertySubType;
    return property.PropertyType || "Property";
  };

  const getLivingArea = () => {
    const area =
      property.building_area_total ||
      property.LivingArea ||
      property.LivingAreaMinimum;
    if (area) return `${area} sq ft`;

    if (property.LivingAreaMinimum && property.LivingAreaMaximum) {
      return `${property.LivingAreaMinimum} - ${property.LivingAreaMaximum} sq ft`;
    }
    return "";
  };

  const history = [
    {
      date: property.ModificationTimestamp
        ? new Date(property.ModificationTimestamp).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        : "Recent",
      event: property.StandardStatus || property.standard_status || "Listed",
      price: getPrice(),
      source: `MLS # ${property.listing_key || property.ListingKey || property.PropertyKey}`,
    },
  ];

  const beds = getBedCount();
  const baths = getBathCount();
  const livingArea = getLivingArea();
  const builtYear = property.year_built || property.YearBuilt;

  const description =
    property.public_remarks ||
    property.PublicRemarks ||
    property.PrivateRemarks ||
    property.Description ||
    `This ${getPropertyType()} is located in ${getCity()}, ${property.StateOrProvince || "Ontario"}${builtYear ? `. Built in ${builtYear}` : ""}${beds || baths ? `, this property features ${beds ? `${beds} bedrooms` : ""}${beds && baths ? " and " : ""}${baths ? `${baths} bathrooms` : ""}` : ""}${livingArea ? ` with ${livingArea} of living space` : ""}.`;

  const quickFacts = [
    { label: "Lot Size", value: getLotSizeSummary(property) },
    { label: "Parking", value: getParkingSummary(property) },
    { label: "Annual Taxes", value: getTaxAnnualAmount(property) },
  ].filter((item) => item.value);

  return (
    <div className="min-h-screen bg-ds-background">
      <Header />
      <PropertyViewerTracker property={property} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
        <PropertyHeader
          propertyType={getPropertyType()}
          city={getCity()}
          address={getAddress()}
          status={
            property.StandardStatus || property.standard_status || "Active"
          }
          price={getPrice()}
        />

        {propertyImages.length > 0 ? (
          <div className="mb-10">
            <PropertyGalleryGrid images={propertyImages} />
          </div>
        ) : (
          <div className="w-full h-96 bg-ds-card border border-ds-card-border rounded-2xl flex items-center justify-center mb-10">
            <div className="text-center opacity-40">
              <HomeIcon className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No Images Available</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            <PropertyStats
              beds={beds || ""}
              baths={baths || ""}
              sqft={livingArea}
              type={getPropertyType()}
              year={builtYear || ""}
            />

            {quickFacts.length > 0 && (
              <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
                <h2 className={`${ds.h3} mb-4`}>Quick Facts</h2>
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

            <section>
              <h2 className={`${ds.h3} mb-4`}>About this home</h2>
              <div className="bg-white rounded-2xl p-1">
                <OverviewExcerpt text={description} maxChars={400} />
              </div>
            </section>

            <PropertyHistory history={history} />

            {/* Mortgage Calculator Section */}
            <section className="bg-white border border-ds-card-border rounded-2xl p-8 shadow-sm">
              <div className="max-w-3xl">
                <h2 className={`${ds.h3} mb-6 text-2xl`}>
                  Mortgage Calculator
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                  <div className="xl:col-span-2">
                    <MortgageCalculator
                      initialPrice={
                        typeof property.list_price === "number"
                          ? property.list_price
                          : parseFloat(
                            String(
                              property.list_price ||
                              property.ListPrice ||
                              "0",
                            ),
                          )
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            <PropertyDetailsGrid
              property={property}
              price={getPrice()}
              type={getPropertyType()}
              livingArea={livingArea}
            />
          </div>

          <aside>
            <PropertySidebar property={property} city={getCity()} />
          </aside>
        </div>

        {/* Similar Properties Section */}
        <SimilarProperties property={property} />
      </main>

      <Footer />
    </div>
  );
}
