"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Property } from "@/lib/api/types";
import { ds } from "@/lib/design-system-utils";
import {
  getDisplayAddress,
  getListingIsPrivileged,
  hasListPrice,
} from "@/lib/listingDisplay";
import { getDescription } from "@/lib/propertyUtils";

interface ListingAISummaryProps {
  property: Property;
}

export default function ListingAISummary({ property }: ListingAISummaryProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryMarkdown, setSummaryMarkdown] = useState<string>(
    property.ai_summary_markdown || "",
  );
  const [summaryError, setSummaryError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    property.ai_summary_updated_at || null,
  );

  const listingKey = useMemo(
    () => String(property.listing_key || property.PropertyKey || "").trim(),
    [property],
  );

  const summaryPayload = useMemo(() => {
    const isPrivileged = getListingIsPrivileged();
    return {
      listing_key: listingKey,
      address: getDisplayAddress(property, { isPrivileged }),
      city: property.city || property.City || "",
      city_region: property.city_region || "",
      list_price:
        isPrivileged || hasListPrice(property)
          ? property.list_price ?? property.ListPrice ?? null
          : null,
      bedrooms_total: property.bedrooms_total ?? property.BedroomsTotal ?? null,
      bathrooms_total_integer:
        property.bathrooms_total_integer ?? property.BathroomsTotalInteger ?? null,
      building_area_total:
        property.building_area_total ?? property.LivingArea ?? null,
      property_sub_type: property.property_sub_type || property.PropertySubType || "",
      year_built: property.year_built ?? property.YearBuilt ?? null,
      standard_status: property.standard_status || property.StandardStatus || "",
      public_remarks: getDescription(property),
      parking_total: property.parking_total ?? property.ParkingTotal ?? null,
      lot_size_area: property.lot_size_area ?? property.LotSizeArea ?? null,
      appliances: property.appliances || property.Appliances || "",
    };
  }, [property, listingKey]);

  const handleGenerateSummary = async () => {
    setSummaryError("");
    if (!listingKey) {
      setSummaryError("Listing key is missing for this property.");
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await fetch("/api/ai/listing-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_key: listingKey,
          property: summaryPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate summary");
      }

      setSummaryMarkdown(data.summary || "");
      setLastUpdated(data.updated_at || null);
    } catch (err: any) {
      setSummaryError(err?.message || "Could not generate summary right now.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className={ds.h3}>AI Listing Summary</h2>
        <button
          type="button"
          onClick={handleGenerateSummary}
          disabled={isSummarizing}
          className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-60"
        >
          {isSummarizing ? "Generating..." : summaryMarkdown ? "Refresh Summary" : "Generate Summary"}
        </button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-ds-body mb-3">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}

      {summaryError ? (
        <p className="text-sm text-red-600 font-medium">{summaryError}</p>
      ) : summaryMarkdown ? (
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {summaryMarkdown}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="text-sm text-ds-body">
          Generate a concise AI summary for this listing, including highlights and key considerations.
        </p>
      )}
    </section>
  );
}
