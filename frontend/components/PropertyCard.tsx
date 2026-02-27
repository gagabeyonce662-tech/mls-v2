"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { colors, propertyCard } from "@/config/design-system";
import type { Property } from "@/lib/api";
import { getPropertyKey } from "@/lib/propertyUtils";
import { PropertyCardImage } from "@/components/property-card/PropertyCardImage";
import { PropertyCardContent } from "@/components/property-card/PropertyCardContent";
import { usePrefetchProperty } from "@/hooks/react-query";

/* ──────────────────────────── component ──────────────────────────── */

interface PropertyCardProps {
  property: Property;
  variant?: "new" | "featured";
  index?: number;
}

export default function PropertyCard({
  property,
  variant = "featured",
  index = 0,
}: PropertyCardProps) {
  const [clicked, setClicked] = useState(false);
  const propertyKey = getPropertyKey(property);
  const prefetch = usePrefetchProperty();

  return (
    <div
      className={`group relative ${propertyCard.layout.borderRadius} overflow-hidden bg-white transition-all duration-300 ${propertyCard.animation.hoverLift} hover:shadow-xl animate-fadeInUp`}
      style={{
        animationDelay: `${index * propertyCard.animation.staggerDelayMs}ms`,
        border: `1px solid ${colors.cardsBoarder}`,
      }}
      onMouseEnter={() => propertyKey && prefetch(propertyKey)}
    >
      <Link
        href={`/listing/${propertyKey}`}
        onClick={() => setClicked(true)}
        className="block h-full"
      >
        {/* Click overlay */}
        {clicked && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center">
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: colors.primary }}
              />
              <span className="mt-2 text-sm" style={{ color: colors.body }}>
                Loading property…
              </span>
            </div>
          </div>
        )}

        {/* ── Image ── */}
        <PropertyCardImage property={property} variant={variant} />

        {/* ── Content ── */}
        <PropertyCardContent property={property} />
      </Link>
    </div>
  );
}
