"use client";

import React from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { PropertyGallery } from "@/components/ui/PropertyGallery";
import { PropertyPricingSection } from "@/components/ui/PropertyPricingSection";
import { PropertyActionButtons } from "@/components/ui/PropertyActionButtons";
import { PropertyMap } from "@/components/ui/PropertyMap";
import { NearbyListings } from "@/components/ui/NearbyListings";
import { getListingDetails } from "@/data/listingDetails";

// Modular Imports
import { ListingTabs } from "@/components/listing-details/ListingTabs";
import { ListingInsights } from "@/components/listing-details/ListingInsights";

export default function ListingDetails() {
  const params = useParams();
  const id = params?.id as string;
  const propertyData = getListingDetails(id);

  if (!propertyData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Listing Not Found
          </h1>
          <p className="text-gray-600">
            The listing you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Gallery Section */}
        <div className="mb-8">
          <PropertyGallery
            mainImage={propertyData.mainImage}
            thumbnails={propertyData.thumbnails}
          />
        </div>

        {/* Pricing Section */}
        <div className="mb-8">
          <PropertyPricingSection
            address={propertyData.address}
            neighborhood={propertyData.neighborhood}
            propertyType={propertyData.propertyType}
            listedPrice={propertyData.listedPrice}
            listedDate={propertyData.listedDate}
            bedrooms={propertyData.bedrooms}
            bathrooms={propertyData.bathrooms}
            garage={propertyData.garage}
            listingHistory={propertyData.listingHistory}
            priceChanges={propertyData.priceChanges}
          />
        </div>

        {/* Action Buttons */}
        <PropertyActionButtons />

        {/* --- Tabs Navigation --- */}
        <ListingTabs propertyData={propertyData} />

        {/* --- Map and Nearby Listings Section --- */}
        <div className="mt-12 space-y-8">
          <PropertyMap
            latitude={propertyData.mapLocation.latitude}
            longitude={propertyData.mapLocation.longitude}
            address={propertyData.mapLocation.address}
          />
          <NearbyListings listings={propertyData.nearbyListings} />

          {/* --- Property Insights Section --- */}
          <ListingInsights propertyData={propertyData} />
        </div>
      </div>
    </div>
  );
}
