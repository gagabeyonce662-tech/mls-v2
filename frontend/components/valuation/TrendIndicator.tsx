"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { colors } from "@/config/design-system";

type Props = {
  pct30d: number;
  applied: number;
};

export function TrendIndicator({ pct30d, applied }: Props) {
  const Icon =
    pct30d > 0.05 ? TrendingUp : pct30d < -0.05 ? TrendingDown : Minus;
  const tone =
    pct30d > 0.05 ? "#10b981" : pct30d < -0.05 ? "#f59e0b" : colors.body;

  return (
    <div
      className="rounded-2xl p-5 mb-8 flex items-start gap-4 border"
      style={{
        backgroundColor: colors.cards,
        borderColor: colors.cardsBoarder,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${tone}18`, color: tone }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="font-bold" style={{ color: colors.heading }}>
          Neighbourhood momentum (30 days)
        </p>
        <p className="text-sm mt-1" style={{ color: colors.body }}>
          Our model detected a{" "}
          <strong style={{ color: tone }}>
            {pct30d >= 0 ? "+" : ""}
            {pct30d.toFixed(2)}%
          </strong>{" "}
          shift vs the prior 30 days in this area (proxy from listing and sold
          activity). Applied adjustment to the point estimate:{" "}
          <strong>{(applied * 100).toFixed(2)}%</strong>.
        </p>
      </div>
    </div>
  );
}
