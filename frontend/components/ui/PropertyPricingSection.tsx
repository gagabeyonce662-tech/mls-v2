"use client";

import { Bed, Bath, Car } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { ScheduleViewing } from "./ScheduleViewing";

interface ListingHistoryItem {
  dateStart: string;
  dateEnd: string;
  price: string;
  event: string;
  listingId: string;
}

interface PropertyPricingSectionProps {
  address: string;
  neighborhood: string;
  propertyType: string;
  listedPrice: string;
  listedDate: string;
  bedrooms: number;
  bathrooms: number;
  garage: number;
  listingHistory: ListingHistoryItem[];
  priceChanges?: number;
}

export function PropertyPricingSection({
  address,
  neighborhood,
  propertyType,
  listedPrice,
  listedDate,
  bedrooms,
  bathrooms,
  garage,
  listingHistory,
  priceChanges = 0,
}: PropertyPricingSectionProps) {
  // Extract listing ID from listing history
  const listingId = listingHistory[0]?.listingId || "HSE03269";

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Section - Pricing Details */}
      <div className="lg:col-span-2 border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Property Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{address}</h1>
            <p className="text-lg text-gray-600 mb-1">{neighborhood}</p>
            <p className="text-base text-gray-500">{propertyType}</p>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <div className="text-sm text-gray-600 mb-1">Listed for:</div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{listedPrice}</div>
            <div className="text-sm text-gray-500">Listed in {listedDate}</div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-gray-600" />
            <span className="text-base text-gray-700 font-medium">
              {bedrooms} {bedrooms === 1 ? "Bedroom" : "Bedrooms"}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <Bath className="w-5 h-5 text-gray-600" />
            <span className="text-base text-gray-700 font-medium">
              {bathrooms} {bathrooms === 1 ? "Bathroom" : "Bathrooms"}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-gray-600" />
            <span className="text-base text-gray-700 font-medium">
              {garage} {garage === 1 ? "Garage" : "Garages"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-6 pt-4">
        <Tabs defaultValue="listing-history" className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
            <TabsTrigger
              value="listing-history"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent px-4 py-3 font-medium text-gray-600"
            >
              Listing History
            </TabsTrigger>
            <TabsTrigger
              value="price-changes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent px-4 py-3 font-medium text-gray-600"
            >
              Price Changes ({priceChanges})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listing-history" className="mt-0">
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Buy/sell history for {address}, {neighborhood} ({propertyType})
              </p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Date Start</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date End</TableHead>
                      <TableHead className="font-semibold text-gray-700">Price</TableHead>
                      <TableHead className="font-semibold text-gray-700">Event</TableHead>
                      <TableHead className="font-semibold text-gray-700">Listing ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listingHistory.map((item, index) => (
                      <TableRow
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <TableCell className="text-gray-700">
                          {item.dateStart || "-"}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {item.dateEnd || "-"}
                        </TableCell>
                        <TableCell className="text-gray-700 font-medium">
                          {item.price}
                        </TableCell>
                        <TableCell className="text-gray-700">{item.event}</TableCell>
                        <TableCell className="text-gray-700">
                          {item.listingId || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="price-changes" className="mt-0">
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Price changes for {address}, {neighborhood} ({propertyType})
              </p>
              {priceChanges === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No price changes recorded.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-700">Date</TableHead>
                        <TableHead className="font-semibold text-gray-700">Previous Price</TableHead>
                        <TableHead className="font-semibold text-gray-700">New Price</TableHead>
                        <TableHead className="font-semibold text-gray-700">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          No price changes available
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center gap-6">
          <button className="text-base font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
            Key Facts
          </button>
          <button className="text-base font-medium text-gray-600 hover:text-gray-900 pb-1">
            Details
          </button>
          <button className="text-base font-medium text-gray-600 hover:text-gray-900 pb-1">
            Deposit
          </button>
        </div>
      </div>
      </div>

      {/* Right Section - Schedule Viewing */}
      <div className="lg:col-span-1">
        <ScheduleViewing
          listingId={listingId}
          address={address}
        />
      </div>
    </div>
  );
}

