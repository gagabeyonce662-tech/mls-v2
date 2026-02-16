"use client";

import { PropertyDetailsTable } from "@/components/ui/PropertyDetailsTable";
import { PropertyDescription } from "@/components/ui/PropertyDescription";
import { CommunityStatistics } from "@/components/ui/CommunityStatistics";
import { DemographicsSection } from "@/components/ui/DemographicsSection";
import { MortgageCalculator } from "@/components/ui/MortgageCalculator";
import { OwnershipCostAnalysis } from "@/components/ui/OwnershipCostAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ListingDetails } from "@/data/listingDetails";

interface ListingTabsProps {
  propertyData: ListingDetails;
}

export function ListingTabs({ propertyData }: ListingTabsProps) {
  return (
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
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
              <h3 className="font-semibold text-gray-900">Elementary School</h3>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Walk Score</h2>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bike Score</h2>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Documents</h2>
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
  );
}
