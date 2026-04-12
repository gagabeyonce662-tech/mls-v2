"use client";

import { MapPin, Maximize2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";

import { env } from "@/lib/env";

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

export function PropertyMap({
  latitude,
  longitude,
  address,
}: PropertyMapProps) {
  // Note: Replace YOUR_GOOGLE_MAPS_API_KEY with your actual API key in production
  // For now, using a placeholder that will show a map with the address
  const googleMapsApiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapUrl =
    googleMapsApiKey !== "YOUR_GOOGLE_MAPS_API_KEY"
      ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(address)}`
      : `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3 relative">
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapUrl}
            ></iframe>
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="icon"
                className="bg-white hover:bg-gray-100"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute top-4 left-4">
              <div className="bg-white px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Listings Search */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Search nearby listings
            </h3>
            <Input
              type="text"
              placeholder="Search nearby listings..."
              className="mb-4"
            />
            <div className="space-y-2 text-sm text-gray-600">
              <p>Find similar properties in the area</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
