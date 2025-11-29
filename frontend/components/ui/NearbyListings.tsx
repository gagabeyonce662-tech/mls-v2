"use client";

import { Button } from "./button";
import { Card, CardContent } from "./card";

interface NearbyListing {
  id: string;
  image: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: string;
  address: string;
}

interface NearbyListingsProps {
  listings: NearbyListing[];
}

export function NearbyListings({ listings }: NearbyListingsProps) {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Similar Condos</h2>
        <Button variant="outline">View More</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 bg-gray-200">
              <img
                src={listing.image}
                alt={listing.address}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {listing.price}
              </div>
              <div className="text-sm text-gray-600 mb-2">{listing.address}</div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{listing.bedrooms} Beds</span>
                <span>{listing.bathrooms} Baths</span>
                <span>{listing.sqft} sqft</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

