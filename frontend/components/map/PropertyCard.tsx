import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { PropertyMarker } from "./types";
import { formatPrice } from "@/lib/helpers";
import { getDetailUrl } from "@/lib/propertyUtils";
import StreetViewButton from "./StreetViewButton";
import {
  Bed,
  Bath,
  Maximize,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

export default function PropertyCard({
  property,
  onViewOnMap,
  onViewStreetView,
  isSelected,
}: {
  property: PropertyMarker;
  onViewOnMap: () => void;
  onViewStreetView: () => void;
  isSelected: boolean;
}) {
  const formatSquareFeet = (sqft: string | number | undefined) => {
    if (!sqft) return "N/A";
    const numSqft = typeof sqft === "string" ? parseFloat(sqft) : sqft;
    if (isNaN(numSqft)) return String(sqft);
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numSqft) + " sqft"
    );
  };

  const raw = property.raw || {};
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryMarkdown, setSummaryMarkdown] = useState<string>("");
  const [summaryError, setSummaryError] = useState<string>("");

  const getPropertyPhoto = () => {
    const raw = property.raw;
    if (!raw || !raw.media) return null;

    const media = raw.media;
    if (Array.isArray(media)) {
      if (media.length === 0) return null;
      const preferred = media.find((m: any) => m.is_preferred);
      return preferred ? preferred.media_url : media[0].media_url;
    }

    if (typeof media === "object") {
      return (media as any).media_url || null;
    }

    return null;
  };

  const details = {
    address:
      raw.unparsed_address ||
      raw.city ||
      property.title ||
      "Address not available",
    city: raw.city || "N/A",
    cityRegion: raw.city_region || "N/A",
    bedrooms: raw.bedrooms_total || "0",
    bathrooms: raw.bathrooms_total_integer || "0",
    squareFeet: raw.building_area_total ?? undefined,
    propertyType: raw.property_sub_type || "Unknown",
    yearBuilt: raw.year_built,
    status: raw.standard_status || "Active",
    listingId: raw.listing_key || raw.listing_id || "N/A",
    photosCount: raw.photos_count || 0,
    category: raw.category_type || "featured",
  };

  const photo = getPropertyPhoto();
  const detailUrl =
    raw.listing_key || raw.PropertyKey ? getDetailUrl(raw as any) : null;

  const summaryPayload = {
    listing_key: raw.listing_key || raw.PropertyKey || property.id,
    address: details.address,
    city: details.city,
    city_region: details.cityRegion,
    list_price: property.price ?? raw.list_price ?? raw.ListPrice,
    bedrooms_total: details.bedrooms,
    bathrooms_total_integer: details.bathrooms,
    building_area_total: details.squareFeet,
    property_sub_type: details.propertyType,
    year_built: details.yearBuilt,
    standard_status: details.status,
    public_remarks: raw.public_remarks || raw.PublicRemarks || "",
    parking_total: raw.parking_total || raw.ParkingTotal || null,
    lot_size_area: raw.lot_size_area || raw.LotSizeArea || null,
    appliances: raw.appliances || raw.Appliances || "",
  };

  const handleGenerateSummary = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSummaryError("");
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/ai/listing-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property: summaryPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate summary");
      }

      setSummaryMarkdown(data.summary || "No summary generated.");
    } catch (err: any) {
      setSummaryError(err?.message || "Could not generate summary right now.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 group ${
        isSelected
          ? "border-ds-primary shadow-xl ring-2 ring-ds-primary/10"
          : "border-ds-card-border shadow-md hover:shadow-xl"
      }`}
      onClick={onViewOnMap}
    >
      {/* Image Section */}
      <div className="relative h-44 w-full overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={details.address}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-gray-300" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            {details.photosCount} Photos
          </div>
          <div
            className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg ${
              details.status === "Active"
                ? "bg-emerald-500 text-white"
                : "bg-ds-primary text-white"
            }`}
          >
            {details.status}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-bold text-lg leading-tight truncate">
            {formatPrice(property.price)}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-ds-heading text-sm line-clamp-1 group-hover:text-ds-primary transition-colors">
          {details.address}
        </h3>

        <div className="flex items-center text-xs text-ds-body">
          <MapPin className="w-3.5 h-3.5 mr-1 text-ds-primary" />
          <span className="truncate">
            {details.city}
            {details.cityRegion !== "N/A" ? `, ${details.cityRegion}` : ""}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-y-2 py-2 border-y border-ds-card-border">
          <div className="flex items-center text-[11px] text-ds-body font-medium">
            <Bed className="w-3.5 h-3.5 mr-1.5 text-ds-primary" />
            <span>{details.bedrooms} Beds</span>
          </div>
          <div className="flex items-center text-[11px] text-ds-body font-medium">
            <Bath className="w-3.5 h-3.5 mr-1.5 text-ds-primary" />
            <span>{details.bathrooms} Baths</span>
          </div>
          <div className="flex items-center text-[11px] text-ds-body font-medium">
            <Maximize className="w-3.5 h-3.5 mr-1.5 text-ds-primary" />
            <span className="truncate">
              {formatSquareFeet(details.squareFeet)}
            </span>
          </div>
          <div className="flex items-center text-[11px] text-ds-body font-medium">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-ds-primary" />
            <span>Built {details.yearBuilt || "N/A"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewOnMap();
            }}
            className="flex-1 px-3 py-2 bg-ds-card text-ds-heading text-xs font-bold rounded-xl border border-ds-card-border hover:bg-white hover:border-ds-primary transition-all"
          >
            Locate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewStreetView();
            }}
            className="flex-1 px-3 py-2 bg-ds-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-ds-primary/20 hover:scale-[1.02] transition-all"
          >
            Street View
          </button>
        </div>

        <div className="pt-1">
          <button
            onClick={handleGenerateSummary}
            disabled={isSummarizing}
            className="w-full px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-60"
          >
            {isSummarizing ? "Generating AI Summary..." : "AI Summary"}
          </button>
        </div>

        {(summaryMarkdown || summaryError) && (
          <div className="rounded-xl border border-ds-card-border bg-gray-50 p-3 text-xs leading-relaxed">
            {summaryError ? (
              <p className="text-red-600 font-medium">{summaryError}</p>
            ) : (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {summaryMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Footer Meta */}
        <div className="flex justify-between items-center text-[10px] text-ds-body pt-1 font-medium">
          <span className="opacity-60 uppercase tracking-tighter">
            ID: {details.listingId}
          </span>
          {detailUrl && (
            <Link
              href={detailUrl}
              onClick={(e) => e.stopPropagation()}
              className="text-ds-primary hover:underline flex items-center gap-1"
            >
              Details <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
