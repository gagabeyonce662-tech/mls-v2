"use client";

import {
  TrendingDown,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { colors } from "@/config/design-system";

type Est = {
  low: number;
  market: number;
  high: number;
  quick_sale_low: number;
  quick_sale_high: number;
};

function fmt(n: number) {
  if (!n || n <= 0) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function EstimateRangeCard({ estimate }: { estimate: Est }) {
  const ranges = [
    {
      label: "Low estimate",
      value: fmt(estimate.low),
      icon: <TrendingDown className="w-5 h-5" />,
      accent: "#f59e0b",
      description: "Conservative market value",
    },
    {
      label: "Market value",
      value: fmt(estimate.market),
      icon: <Target className="w-5 h-5" />,
      accent: colors.primary,
      description: "Most likely selling price",
      featured: true,
    },
    {
      label: "High estimate",
      value: fmt(estimate.high),
      icon: <TrendingUp className="w-5 h-5" />,
      accent: "#10b981",
      description: "In a competitive market",
    },
    {
      label: "Quick sale",
      value:
        estimate.quick_sale_low > 0
          ? `${fmt(estimate.quick_sale_low)} – ${fmt(estimate.quick_sale_high)}`
          : "—",
      icon: <Zap className="w-5 h-5" />,
      accent: "#8b5cf6",
      description: "For a faster closing",
    },
  ];

  return (
    <div>
      <div className="max-w-3xl mx-auto mb-14">
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: `${colors.primary}10` }}
        >
          <div
            className="absolute left-[20%] right-[20%] h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, #f59e0b, ${colors.primary}, #10b981)`,
            }}
          />
          <div
            className="absolute top-1/2 w-5 h-5 rounded-full border-[3px] border-white shadow-lg"
            style={{
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: colors.primary,
            }}
          />
        </div>
        <div
          className="flex justify-between mt-3 text-xs font-medium"
          style={{ color: colors.body }}
        >
          <span>{estimate.low > 0 ? fmt(estimate.low * 0.95) : "—"}</span>
          <span style={{ color: colors.primary, fontWeight: 700 }}>
            {fmt(estimate.market)}
          </span>
          <span>{estimate.high > 0 ? fmt(estimate.high * 1.05) : "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ranges.map((range, i) => (
          <div
            key={i}
            className={`relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl overflow-hidden group ${
              range.featured ? "ring-2 ring-offset-2" : ""
            }`}
            style={{
              backgroundColor: "#ffffff",
              border: `1px solid ${colors.cardsBoarder}`,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
              style={{ backgroundColor: range.accent }}
            />
            {range.featured && (
              <div
                className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${colors.primary}10`,
                  color: colors.primary,
                }}
              >
                Best estimate
              </div>
            )}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: `${range.accent}14`,
                color: range.accent,
              }}
            >
              {range.icon}
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: colors.body }}>
              {range.label}
            </p>
            <p
              className="text-2xl lg:text-3xl font-bold mb-2"
              style={{ color: colors.heading }}
            >
              {range.value}
            </p>
            <p className="text-xs" style={{ color: colors.body }}>
              {range.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
