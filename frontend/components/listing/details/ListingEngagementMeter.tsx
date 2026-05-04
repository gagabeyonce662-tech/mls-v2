"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";
import { ds } from "@/lib/design-system-utils";

type Engagement = {
  views_7d: number;
  views_30d: number;
  activity_band: string;
  peer_views_7d_sample?: number;
  peer_context_note?: string;
};

export default function ListingEngagementMeter({
  listingKey,
  title = "Interest on this site",
}: {
  listingKey: string;
  title?: string;
}) {
  const [data, setData] = useState<Engagement | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!listingKey) return;
    const base = API_BASE_URL.replace(/\/+$/, "");
    fetch(
      `${base}/api/mls/listing-engagement/?listing_key=${encodeURIComponent(listingKey)}`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setErr(true));
  }, [listingKey]);

  if (err || !data) {
    return null;
  }

  const band = data.activity_band || "low";
  const pct =
    band === "high" ? 85 : band === "medium" ? 50 : Math.min(35, 10 + data.views_7d * 2);

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <h2 className={`${ds.h3} mb-2`}>{title}</h2>
      <p className="text-xs text-ds-body mb-4">
        Based on anonymous page views recorded here — not board-wide or national
        demand.
      </p>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-ds-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-ds-body mt-2 capitalize">
            Activity band: <span className="font-semibold text-ds-heading">{band}</span>{" "}
            · {data.views_7d} views (7d) · {data.views_30d} views (30d)
          </p>
          {data.peer_context_note ? (
            <p className="text-[10px] text-ds-body mt-1">{data.peer_context_note}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
