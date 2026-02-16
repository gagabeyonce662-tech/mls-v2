"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PropertyGallery } from "@/components/ui/PropertyGallery";
import { PropertyPricingSection } from "@/components/ui/PropertyPricingSection";
import { PropertyActionButtons } from "@/components/ui/PropertyActionButtons";
import { PropertyDetailsTable } from "@/components/ui/PropertyDetailsTable";
import { PropertyDescription } from "@/components/ui/PropertyDescription";
import { PropertyMap } from "@/components/ui/PropertyMap";
import { NearbyListings } from "@/components/ui/NearbyListings";
import { MortgageCalculator } from "@/components/ui/MortgageCalculator";
import { OwnershipCostAnalysis } from "@/components/ui/OwnershipCostAnalysis";
import { CommunityStatistics } from "@/components/ui/CommunityStatistics";
import { DemographicsSection } from "@/components/ui/DemographicsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getListingDetails } from "@/data/listingDetails";

import { ListingMortgageCalculator } from "@/components/calculators/ListingMortgageCalculator";
import { CashflowCalculator } from "@/components/calculators/CashflowCalculator";

// Removed inline MortgageCalculatorSection

// Removed inline CashflowCalculatorSection

export default function ListingDetails() {
  const params = useParams();
  const id = params?.id as string;
  const propertyData = getListingDetails(id);

  // Notes / toggles for the insights section
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [toured, setToured] = useState(false);

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

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-12 h-auto p-1 bg-gray-100 border border-gray-200 rounded-md">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="amenities"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Amenities
            </TabsTrigger>
            <TabsTrigger
              value="price-history"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Price History
            </TabsTrigger>
            <TabsTrigger
              value="taxes"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Taxes
            </TabsTrigger>
            <TabsTrigger
              value="schools"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Schools
            </TabsTrigger>
            <TabsTrigger
              value="walk-score"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Walk Score
            </TabsTrigger>
            <TabsTrigger
              value="transit-score"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Transit Score
            </TabsTrigger>
            <TabsTrigger
              value="bike-score"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Bike Score
            </TabsTrigger>
            <TabsTrigger
              value="community"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Community
            </TabsTrigger>
            <TabsTrigger
              value="mortgage"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Mortgage
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white border-r border-gray-200 last:border-r-0 rounded-sm"
            >
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-8">
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <PropertyDetailsTable details={propertyData.details} />
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <PropertyDescription description={propertyData.description} />
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <PropertyDetailsTable details={propertyData.details} />
            </div>
          </TabsContent>

          {/* Amenities Tab */}
          <TabsContent value="amenities" className="mt-6">
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Building Amenities
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Underground Parking</li>
                    <li>Storage Locker</li>
                    <li>Elevator</li>
                    <li>Security System</li>
                  </ul>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Unit Features
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Balcony</li>
                    <li>Ensuite Laundry</li>
                    <li>Central Air Conditioning</li>
                    <li>Forced Air Heating</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Price History Tab */}
          <TabsContent value="price-history" className="mt-6">
            <CommunityStatistics
              priceTrends={propertyData.priceTrends}
              salesDistribution={propertyData.salesDistribution}
              priceDistribution={propertyData.priceDistribution}
            />
          </TabsContent>

          {/* Taxes Tab */}
          <TabsContent value="taxes" className="mt-6">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Property Taxes
              </h2>
              <PropertyDetailsTable
                details={[
                  { label: "Property Tax", value: "$2,000 - $2,499" },
                  { label: "Tax Year", value: "2024" },
                  { label: "Assessment Value", value: "$450,000" },
                ]}
              />
            </div>
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" className="mt-6">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Nearby Schools
              </h2>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900">
                    Elementary School
                  </h3>
                  <p className="text-gray-600">
                    Centretown Public School - 0.5 km away
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900">High School</h3>
                  <p className="text-gray-600">
                    Lisgar Collegiate Institute - 1.2 km away
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Walk Score Tab */}
          <TabsContent value="walk-score" className="mt-6">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Walk Score
              </h2>
              <div className="text-6xl font-bold text-teal-600 mb-4">92</div>
              <p className="text-gray-700">
                Walker&apos;s Paradise - Daily errands do not require a car.
              </p>
            </div>
          </TabsContent>

          {/* Transit Score Tab */}
          <TabsContent value="transit-score" className="mt-6">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Transit Score
              </h2>
              <div className="text-6xl font-bold text-teal-600 mb-4">95</div>
              <p className="text-gray-700">
                Excellent Transit - World-class public transportation.
              </p>
            </div>
          </TabsContent>

          {/* Bike Score Tab */}
          <TabsContent value="bike-score" className="mt-6">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bike Score
              </h2>
              <div className="text-6xl font-bold text-teal-600 mb-4">88</div>
              <p className="text-gray-700">
                Very Bikeable - Biking is convenient for most trips.
              </p>
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="mt-6">
            <div className="space-y-8">
              <CommunityStatistics
                priceTrends={propertyData.priceTrends}
                salesDistribution={propertyData.salesDistribution}
                priceDistribution={propertyData.priceDistribution}
              />
              <DemographicsSection
                incomeDistribution={propertyData.incomeDistribution}
                demographics={propertyData.demographics}
              />
            </div>
          </TabsContent>

          {/* Mortgage Tab */}
          <TabsContent value="mortgage" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MortgageCalculator />
              <OwnershipCostAnalysis
                totalCost={propertyData.ownershipCosts.totalCost}
                costs={propertyData.ownershipCosts.costs}
              />
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Documents
              </h2>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-semibold text-gray-900">
                    Property Disclosure Statement
                  </h3>
                  <p className="text-sm text-gray-600">PDF - 2.5 MB</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-semibold text-gray-900">Floor Plan</h3>
                  <p className="text-sm text-gray-600">PDF - 1.2 MB</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-semibold text-gray-900">
                    Building Information
                  </h3>
                  <p className="text-sm text-gray-600">PDF - 3.1 MB</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Map and Nearby Listings Section */}
        <div className="mt-12 space-y-8">
          <PropertyMap
            latitude={propertyData.mapLocation.latitude}
            longitude={propertyData.mapLocation.longitude}
            address={propertyData.mapLocation.address}
          />
          <NearbyListings listings={propertyData.nearbyListings} />

          {/* --- Property Insights Section --- */}
          <section className="mt-16 border-t border-gray-200 pt-10 space-y-10">
            {/* --- Write a Note --- */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Write a Note About This Home
                </h2>

                {/* High-contrast Toggle Switch — fixed alignment */}
                <button
                  onClick={() => setShowNote(!showNote)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 border ${
                    showNote
                      ? "bg-teal-500 border-teal-600 shadow-[0_0_6px_rgba(13,148,136,0.6)]"
                      : "bg-gray-600 border-gray-800 shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                  }`}
                  aria-label="Toggle note section"
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                      showNote ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Conditionally show textarea + toured checkbox */}
              {showNote && (
                <>
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Add your personal notes about this property..."
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                </>
              )}
            </div>

            {/* --- Tax History --- */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Tax History
              </h2>
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 text-left">Year</th>
                    <th className="p-2 text-left">Taxes</th>
                    <th className="p-2 text-left">Land</th>
                    <th className="p-2 text-left">Building</th>
                    <th className="p-2 text-left">Total</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  <tr className="border-t">
                    <td className="p-2">2021</td>
                    <td className="p-2">$2,526</td>
                    <td className="p-2">-</td>
                    <td className="p-2">-</td>
                    <td className="p-2">$209,000</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">2020</td>
                    <td className="p-2">$2,484</td>
                    <td className="p-2">-</td>
                    <td className="p-2">-</td>
                    <td className="p-2">$209,000</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">2019</td>
                    <td className="p-2">$2,373</td>
                    <td className="p-2">-</td>
                    <td className="p-2">-</td>
                    <td className="p-2">$194,250</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* --- Mortgage  Calculator --- */}
            <ListingMortgageCalculator />

            {/* ---  Cashflow Calculator --- */}
            <CashflowCalculator />

            {/* --- Nearby Schools --- */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Nearby Schools
              </h2>
              <ul className="space-y-2 text-gray-800">
                <li>🏫 Westdale Secondary School — 3.2 km</li>
                <li>🏫 St. Lawrence Catholic Elementary School — 0.5 km</li>
              </ul>
            </div>

            {/* --- Market Stats --- */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Market Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800">
                <div className="border p-4 rounded-lg bg-white">
                  <p className="text-sm text-gray-500">October 2025</p>
                  <h3 className="text-xl font-semibold">Median Price</h3>
                  <p className="text-teal-600 font-bold text-lg">$431,667</p>
                </div>
                <div className="border p-4 rounded-lg bg-white">
                  <p className="text-sm text-gray-500">October 2025</p>
                  <h3 className="text-xl font-semibold">New Listings</h3>
                  <p className="text-teal-600 font-bold text-lg">5</p>
                </div>
                <div className="border p-4 rounded-lg bg-white">
                  <p className="text-sm text-gray-500">October 2025</p>
                  <h3 className="text-xl font-semibold">
                    Median Days on Market
                  </h3>
                  <p className="text-teal-600 font-bold text-lg">47</p>
                </div>
              </div>
              <div className="mt-6 text-sm text-gray-600">
                1 Year: <span className="text-red-600">-7.9%</span> • 5 Years:{" "}
                <span className="text-green-600">+6%</span> • 10 Years:{" "}
                <span className="text-green-600">+113%</span>
              </div>
            </div>

            {/* --- Demographics --- */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Demographics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-800">
                <div>
                  Population (2021): <strong>446</strong>
                </div>
                <div>
                  Average Age: <strong>40.4</strong>
                </div>
                <div>
                  Average Income: <strong>$72,500</strong>
                </div>
                <div>
                  Renters: <strong>75.5%</strong>
                </div>
                <div>
                  Condos: <strong>14.3%</strong>
                </div>
                <div>
                  Education: <strong>41.1% College/University</strong>
                </div>
                <div>
                  Average Home Value: <strong>$600,000</strong>
                </div>
                <div>
                  Households with Children: <strong>36.4%</strong>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                * Source: Statistics Canada - 2021 Census
              </p>
            </div>

            {/* --- Disclaimers --- */}
            <div className="text-xs text-gray-500 mt-8">
              Data is provided courtesy of PROPTX. The information herein must
              only be used by consumers with a bona fide interest in real estate
              transactions. The information is deemed reliable but not
              guaranteed accurate by PROPTX.
              <br />© 2025 HouseSigma Inc. All rights reserved.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
