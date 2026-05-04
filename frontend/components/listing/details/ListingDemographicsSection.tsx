"use client";

import { DemographicsSection } from "@/components/ui/DemographicsSection";
import { ds } from "@/lib/design-system-utils";

type Profile = Record<string, unknown> | null;

type IncomeSlice = { range: string; value: number; color: string };

function coerceProfile(profile: Profile): {
  incomeDistribution: IncomeSlice[];
  demographics: {
    population: number;
    medianAge: number;
    averageHouseholdSize: number;
    averageHouseholdIncome: string;
    educationLevel: string;
    employmentRate: string;
    languageSpoken: string;
  };
  disclaimer?: string;
} | null {
  if (!profile || typeof profile !== "object") return null;
  const incomeDistribution = (profile.incomeDistribution as IncomeSlice[]) || [];
  const population = Number(profile.population) || 0;
  const medianAge = Number(profile.medianAge) || 0;
  const averageHouseholdSize = Number(profile.averageHouseholdSize) || 0;
  const averageHouseholdIncome = String(profile.averageHouseholdIncome ?? "—");
  const educationLevel = String(profile.educationLevel ?? "—");
  const employmentRate = String(profile.employmentRate ?? "—");
  const languageSpoken = String(profile.languageSpoken ?? "—");
  const disclaimer = profile.disclaimer ? String(profile.disclaimer) : undefined;
  return {
    incomeDistribution,
    demographics: {
      population,
      medianAge,
      averageHouseholdSize,
      averageHouseholdIncome,
      educationLevel,
      employmentRate,
      languageSpoken,
    },
    disclaimer,
  };
}

export default function ListingDemographicsSection({
  fsa,
  profile,
}: {
  fsa: string | null;
  profile: Profile;
}) {
  const coerced = coerceProfile(profile);
  if (!fsa || !coerced || coerced.incomeDistribution.length === 0) {
    return null;
  }

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <h2 className={`${ds.h3} mb-2`}>Neighbourhood demographics (FSA {fsa})</h2>
      {coerced.disclaimer ? (
        <p className="text-xs text-ds-body mb-4">{coerced.disclaimer}</p>
      ) : (
        <p className="text-xs text-ds-body mb-4">
          FSA-level profile (coarser than postal). Source: bundled public-style
          dataset — replace with official census import for production.
        </p>
      )}
      <DemographicsSection
        incomeDistribution={coerced.incomeDistribution}
        demographics={coerced.demographics}
      />
    </section>
  );
}
