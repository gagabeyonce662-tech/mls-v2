"use client";

import Image from "next/image";
import { Bed, Bath, Ruler, MapPin } from "lucide-react";
import { colors } from "@/config/design-system";

export type CompRow = {
  listing_key?: string;
  price?: number;
  bedrooms_total?: number | null;
  bathrooms_total_integer?: number | null;
  living_area?: number | null;
  unparsed_address?: string;
  city?: string;
  distance_km?: number;
  source?: string;
};

function fmtPrice(n?: number) {
  if (!n || n <= 0) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ComparablesGrid({ comps }: { comps: CompRow[] }) {
  if (!comps.length) {
    return (
      <p className="text-center py-12" style={{ color: colors.body }}>
        No comparable sales found in our catalog for this location yet. Try widening
        your search or check back after more listings close in this area.
      </p>
    );
  }

  const placeholder =
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {comps.map((property, i) => (
        <div
          key={property.listing_key || i}
          className="group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
          style={{
            backgroundColor: colors.cards,
            border: `1px solid ${colors.cardsBoarder}`,
          }}
        >
          <div className="relative h-56 overflow-hidden">
            <Image
              src={placeholder}
              alt={property.unparsed_address || "Comparable"}
              width={400}
              height={300}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute top-3 left-3">
              <span
                className="px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-sm"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.9)",
                  color: "#fff",
                }}
              >
                {property.source === "sold_proxy" ? "Sold (proxy)" : "Active comp"}
              </span>
            </div>
            {property.distance_km != null && (
              <div className="absolute top-3 right-3">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.4)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {property.distance_km} km
                </span>
              </div>
            )}
            <div className="absolute bottom-3 left-3">
              <p className="text-white text-xl font-bold drop-shadow-lg">
                {fmtPrice(property.price)}
              </p>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-bold mb-1 line-clamp-2" style={{ color: colors.heading }}>
              {property.unparsed_address || property.listing_key || "Listing"}
            </h3>
            <p
              className="text-xs flex items-center gap-1 mb-4"
              style={{ color: colors.body }}
            >
              <MapPin className="w-3 h-3" />
              {property.city || "—"}
            </p>
            <div
              className="border-t pt-3"
              style={{ borderColor: colors.cardsBoarder }}
            >
              <div
                className="flex items-center gap-5 text-xs flex-wrap"
                style={{ color: colors.body }}
              >
                <div className="flex items-center gap-1.5">
                  <Bed className="w-3.5 h-3.5" />
                  <span className="font-medium">{property.bedrooms_total ?? "—"}</span>{" "}
                  Beds
                </div>
                <div className="flex items-center gap-1.5">
                  <Bath className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {property.bathrooms_total_integer ?? "—"}
                  </span>{" "}
                  Baths
                </div>
                <div className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {property.living_area != null
                      ? Math.round(property.living_area).toLocaleString()
                      : "—"}
                  </span>{" "}
                  sqft
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
