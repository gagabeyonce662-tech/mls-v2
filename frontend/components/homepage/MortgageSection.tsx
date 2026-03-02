"use client";

import { colors } from "@/config/design-system";
import Image from "next/image";

export default function MortgageCalculatorSection() {
  return (
    <div
      className="py-16 relative overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, ${colors.primary}, #0f1f3d)`,
        color: colors.cards,
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <Image
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
          alt="Background"
          fill
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-ds-h2 leading-tight font-inter">
              Calculate Your Mortgage
              <br />
              Payments Easily
            </h2>
            <p
              className="text-ds-text-regular font-inter"
              style={{ color: colors.cards, opacity: 0.9 }}
            >
              Use our mortgage calculator to estimate your monthly payments and
              find the perfect home within your budget.
            </p>
            <button
              className="px-8 py-3 rounded-md font-semibold transition-opacity hover:opacity-90 font-inter"
              style={{ backgroundColor: colors.cards, color: colors.primary }}
            >
              Learn More
            </button>
          </div>
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80"
              alt="Modern House"
              width={600}
              height={400}
              className="rounded-xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
