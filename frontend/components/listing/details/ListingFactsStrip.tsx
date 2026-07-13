import {
  BedDouble,
  Building2,
  CalendarClock,
  Home,
  Ruler,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ListingFact {
  label: string;
  value: string;
}

interface ListingFactsStripProps {
  facts: ListingFact[];
}

function getIcon(label: string): LucideIcon {
  const normalized = label.toLowerCase();
  if (normalized.includes("bed")) return BedDouble;
  if (normalized.includes("size") || normalized.includes("area")) return Ruler;
  if (normalized.includes("occupancy") || normalized.includes("completion")) {
    return CalendarClock;
  }
  if (normalized.includes("deposit") || normalized.includes("signing")) {
    return WalletCards;
  }
  if (normalized.includes("developer")) return Building2;
  return Home;
}

export default function ListingFactsStrip({ facts }: ListingFactsStripProps) {
  const visibleFacts = facts.filter(
    (fact) => fact.label.trim().length > 0 && fact.value.trim().length > 0,
  );

  if (visibleFacts.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)]">
      <div className="flex snap-x overflow-x-auto lg:grid lg:grid-cols-6">
        {visibleFacts.slice(0, 6).map((fact, index) => {
          const Icon = getIcon(fact.label);
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className={`min-w-[190px] snap-start px-5 py-5 lg:min-w-0 ${
                index > 0 ? "border-l border-slate-200" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-blue-50 p-2 text-ds-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {fact.label}
                  </p>
                  <p className="mt-1 break-words text-sm font-bold leading-5 text-slate-950 sm:text-base">
                    {fact.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
