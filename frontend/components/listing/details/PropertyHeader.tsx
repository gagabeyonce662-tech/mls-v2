import React from "react";
import { Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyHeaderProps {
  headline: string;
  propertyType: string;
  city: string;
  address: string;
  status?: string;
  price: string;
  developer?: string;
  isFeaturedTag?: boolean;
  labelTags?: string[];
  customTags?: string[];
  statusTags?: string[];
  priceLabel?: string;
  priceClassName?: string;
  rightActions?: React.ReactNode;
}

function isMeaningfulTag(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return Boolean(
    normalized &&
    !["status unavailable", "unavailable", "n/a", "unknown"].includes(
      normalized,
    ),
  );
}

export default function PropertyHeader({
  headline,
  propertyType,
  city,
  address,
  status,
  price,
  developer,
  isFeaturedTag = false,
  labelTags = [],
  customTags = [],
  statusTags = [],
  priceLabel = "List Price",
  priceClassName,
  rightActions,
}: PropertyHeaderProps) {
  const allTags = [
    ...(statusTags.length > 0 ? statusTags : status ? [status] : []),
    ...labelTags,
    ...customTags,
  ]
    .map((tag) => String(tag || "").trim())
    .filter(isMeaningfulTag);

  const visibleTags = Array.from(
    new Map(allTags.map((tag) => [tag.toLowerCase(), tag])).values(),
  ).slice(0, 4);

  return (
    <header className="grid gap-6 pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-ds-primary">
            {propertyType}
          </span>
          {isFeaturedTag ? (
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
              Featured
            </span>
          ) : null}
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="max-w-4xl text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-[46px]">
          {headline}
        </h1>

        {developer ? (
          <p className="mt-3 inline-flex items-center gap-2 text-base font-semibold text-slate-700">
            <Building2 className="h-4 w-4 text-ds-primary" aria-hidden />
            By {developer}
          </p>
        ) : null}

        <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-600 sm:text-base">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            aria-hidden
          />
          <span>{address || city}</span>
        </p>
      </div>

      <div className="flex min-w-[240px] flex-col items-start lg:items-end">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          {priceLabel}
        </p>
        <p
          className={cn(
            "mt-1 text-4xl font-extrabold leading-none tracking-[-0.035em] text-ds-primary sm:text-5xl",
            priceClassName,
          )}
        >
          {price}
        </p>
        {rightActions ? <div className="mt-4">{rightActions}</div> : null}
      </div>
    </header>
  );
}
