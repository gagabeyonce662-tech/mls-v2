// app/(root)/listing/[id]/page.tsx
import React from "react";
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

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
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
      : property.Media && property.Media.length > 0
        ? property.Media.map((m: any) => m.MediaURL || m.media_url).filter(
            Boolean,
          )
        : property.Photos && property.Photos.length > 0
          ? property.Photos.map((p: any) => p.PhotoURL || p).filter(Boolean)
          : [];

  const getPrice = () => {
    const price = property.list_price ?? property.ListPrice;
    if (!price && price !== 0) return "Price on request";

    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numericPrice)
      ? "Price on request"
      : `$${numericPrice.toLocaleString()}`;
  };

  const getBedCount = () =>
    property.bedrooms_total || property.BedroomsTotal || "N/A";
  const getBathCount = () =>
    property.bathrooms_total_integer || property.BathroomsTotalInteger || "N/A";
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
    if (property.building_area_total)
      return `${property.building_area_total} sq ft`;
    if (property.LivingArea) return `${property.LivingArea} sq ft`;
    return "N/A";
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

  const description =
    property.public_remarks ||
    property.PublicRemarks ||
    property.PrivateRemarks ||
    property.Description ||
    `This ${getPropertyType()} is located in ${getCity()}, ${property.StateOrProvince || "Ontario"}. Built in ${property.year_built || property.YearBuilt || "N/A"}, this property features ${getBedCount()} bedrooms and ${getBathCount()} bathrooms${getLivingArea() !== "N/A" ? ` with ${getLivingArea()} of living space` : ""}.`;

  return (
    <div className="min-h-screen bg-ds-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 animate-in fade-in duration-700">
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
              beds={getBedCount()}
              baths={getBathCount()}
              sqft={getLivingArea()}
              type={getPropertyType()}
              year={property.year_built || property.YearBuilt || "N/A"}
            />

            <section>
              <h2 className={`${ds.h3} mb-4`}>About this home</h2>
              <div className="bg-white rounded-2xl p-1">
                <OverviewExcerpt text={description} maxChars={400} />
              </div>
            </section>

            <PropertyHistory history={history} />

            <PropertyDetailsGrid
              property={property}
              price={getPrice()}
              type={getPropertyType()}
              livingArea={getLivingArea()}
            />
          </div>

          <aside>
            <PropertySidebar property={property} city={getCity()} />
          </aside>
        </div>

        {/* Similar Properties Section */}
        <section className="mt-20 border-t border-ds-card-border pt-16">
          <h2 className={`${ds.h2} mb-8`}>Similar Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl shadow-sm border border-ds-card-border overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="h-56 bg-ds-card relative overflow-hidden">
                  <Image
                    src={`https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop`}
                    alt="Similar home"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-ds-primary font-bold text-lg">
                      $1,245,000
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-ds-body">
                      Active
                    </span>
                  </div>
                  <p className="font-semibold text-ds-heading mb-1">
                    Luxury Villa in {getCity()}
                  </p>
                  <p className="text-sm text-ds-body">
                    4 Beds • 3 Baths • 2,400 sqft
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
