"use client";

import type { ListingCatalogStatsPayload } from "@/lib/api/properties";
import { ds } from "@/lib/design-system-utils";

function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString("en-CA")}`;
}

export default function ListingCatalogStatsSection({
  stats,
  currentListPrice,
}: {
  stats: ListingCatalogStatsPayload | null;
  currentListPrice: number | null;
}) {
  if (!stats || stats.sample_size < 1) {
    return (
      <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
        <h2 className={`${ds.h3} mb-2`}>Listing activity in our catalog</h2>
        <p className="text-sm text-ds-body">
          Not enough comparable active listings in our database for this area to
          show aggregate stats.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <h2 className={`${ds.h3} mb-2`}>Listing activity in our catalog</h2>
      <p className="text-xs text-ds-body mb-4 leading-relaxed">{stats.disclaimer}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-ds-card-border bg-ds-card/40 p-3">
          <p className="text-[10px] uppercase text-ds-body">Sample size</p>
          <p className="text-lg font-semibold text-ds-heading">{stats.sample_size}</p>
        </div>
        <div className="rounded-xl border border-ds-card-border bg-ds-card/40 p-3">
          <p className="text-[10px] uppercase text-ds-body">Median list</p>
          <p className="text-lg font-semibold text-ds-heading">
            {fmtMoney(stats.median_list_price)}
          </p>
        </div>
        <div className="rounded-xl border border-ds-card-border bg-ds-card/40 p-3">
          <p className="text-[10px] uppercase text-ds-body">Mean list</p>
          <p className="text-lg font-semibold text-ds-heading">
            {fmtMoney(stats.mean_list_price)}
          </p>
        </div>
        <div className="rounded-xl border border-ds-card-border bg-ds-card/40 p-3">
          <p className="text-[10px] uppercase text-ds-body">Median $/sqft</p>
          <p className="text-lg font-semibold text-ds-heading">
            {stats.median_price_per_sqft != null
              ? `$${Math.round(stats.median_price_per_sqft).toLocaleString("en-CA")}`
              : "—"}
          </p>
        </div>
      </div>
      {currentListPrice != null &&
        stats.median_list_price != null &&
        stats.median_list_price > 0 && (
          <div className="rounded-xl border border-ds-card-border bg-ds-card/20 p-4">
            <p className="text-xs font-medium text-ds-heading mb-2">
              This listing vs area median (list price)
            </p>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-ds-primary rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (currentListPrice / stats.median_list_price) * 50,
                  )}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-ds-body mt-2">
              Bar length is illustrative (ratio capped for display); not an
              appraisal.
            </p>
          </div>
        )}
    </section>
  );
}
