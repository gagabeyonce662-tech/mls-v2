"use client";

import { colors } from "@/config/design-system";

type Row = { feature: string; delta: number };

const LABELS: Record<string, string> = {
  living_area: "Living area vs median comps",
  bedrooms_total: "Bedrooms",
  bedrooms_partial: "Partial bedrooms (den / basement)",
  bathrooms_total: "Bathrooms",
  parking_total: "Garage / parking",
  lot_size: "Lot size",
  tax_annual_amount: "Property taxes (sanity)",
};

export function BreakdownPanel({ rows }: { rows: Row[] }) {
  if (!rows.length) return null;

  return (
    <div
      className="rounded-2xl p-6 mb-8 border"
      style={{
        backgroundColor: "#fff",
        borderColor: colors.cardsBoarder,
      }}
    >
      <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: colors.icon }}>
        Adjustment breakdown
      </p>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={`${r.feature}-${i}`}
            className="flex justify-between text-sm border-b pb-2 last:border-0"
            style={{ borderColor: colors.cardsBoarder }}
          >
            <span style={{ color: colors.body }}>
              {LABELS[r.feature] || r.feature}
            </span>
            <span
              className="font-mono font-medium"
              style={{ color: r.delta >= 0 ? "#10b981" : "#ef4444" }}
            >
              {r.delta >= 0 ? "+" : ""}
              {new Intl.NumberFormat("en-CA", {
                style: "currency",
                currency: "CAD",
                maximumFractionDigits: 0,
              }).format(r.delta)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
