"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { colors } from "@/config/design-system";
import {
  getPropertyTypesForValuation,
  postValuationEstimate,
  type ValuationEstimateRequest,
  type ValuationEstimateResponse,
  type ValuationLookupPayload,
} from "@/lib/api/valuation";

type Props = {
  lookup: ValuationLookupPayload | null;
  onResult: (r: ValuationEstimateResponse) => void;
  onBusyChange?: (busy: boolean) => void;
};

export function ValuationInputForm({ lookup, onResult, onBusyChange }: Props) {
  const [types, setTypes] = useState<{ value: string; label: string }[]>([]);
  const [bedrooms, setBedrooms] = useState("");
  const [partial, setPartial] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [garage, setGarage] = useState("");
  const [tax, setTax] = useState("");
  const [ptype, setPtype] = useState("");
  const [frontage, setFrontage] = useState("");
  const [depth, setDepth] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPropertyTypesForValuation()
      .then((rows) =>
        setTypes(rows.map((r) => ({ value: r.value, label: r.label }))),
      )
      .catch(() => setTypes([]));
  }, []);

  useEffect(() => {
    if (!lookup) return;
    setBedrooms(lookup.bedrooms_total != null ? String(lookup.bedrooms_total) : "");
    setPartial(
      lookup.bedrooms_partial != null ? String(lookup.bedrooms_partial) : "",
    );
    setBaths(lookup.bathrooms_total != null ? String(lookup.bathrooms_total) : "");
    setSqft(
      lookup.living_area != null
        ? String(Math.round(lookup.living_area))
        : lookup.above_grade_finished_area != null
          ? String(Math.round(lookup.above_grade_finished_area))
          : "",
    );
    setGarage(lookup.parking_total != null ? String(lookup.parking_total) : "");
    setTax(
      lookup.tax_annual_amount != null ? String(Math.round(lookup.tax_annual_amount)) : "",
    );
    setPtype(lookup.property_sub_type || "");
    setFrontage(lookup.lot_frontage != null ? String(lookup.lot_frontage) : "");
    setDepth(lookup.lot_depth != null ? String(lookup.lot_depth) : "");
  }, [lookup]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!lookup) {
      setError("Search and select a property first.");
      return;
    }
    const body: ValuationEstimateRequest = {
      listing_key: lookup.listing_key,
      latitude: lookup.latitude,
      longitude: lookup.longitude,
      postal_code: lookup.postal_code,
      city: lookup.city,
      city_region: lookup.city_region || undefined,
      property_sub_type: ptype || undefined,
      bedrooms_total: bedrooms ? parseInt(bedrooms, 10) : null,
      bedrooms_partial: partial ? parseInt(partial, 10) : null,
      bathrooms_total: baths ? parseInt(baths, 10) : null,
      living_area: sqft ? parseFloat(sqft) : null,
      parking_total: garage ? parseInt(garage, 10) : null,
      tax_annual_amount: tax ? parseFloat(tax) : null,
      lot_frontage: frontage ? parseFloat(frontage) : null,
      lot_depth: depth ? parseFloat(depth) : null,
    };
    onBusyChange?.(true);
    try {
      const res = await postValuationEstimate(body);
      onResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Estimate failed");
    } finally {
      onBusyChange?.(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl p-8 border space-y-5"
      style={{
        backgroundColor: colors.cards,
        borderColor: colors.cardsBoarder,
      }}
    >
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: colors.heading }}>
          Refine your property
        </h2>
        <p className="text-sm" style={{ color: colors.body }}>
          Adjust beds, baths, size, taxes, and lot — our model applies hedonic-style
          adjustments on top of nearby comparables.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Bedrooms
          </span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Partial beds (den / basement)
          </span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={partial}
            onChange={(e) => setPartial(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Bathrooms
          </span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={baths}
            onChange={(e) => setBaths(e.target.value)}
            inputMode="numeric"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Total living area (sqft)
          </span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Garage spaces
          </span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={garage}
            onChange={(e) => setGarage(e.target.value)}
            inputMode="numeric"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Annual property taxes ($)
          </span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Property type
          </span>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white"
            style={{ borderColor: colors.cardsBoarder, color: colors.heading }}
            value={ptype}
            onChange={(e) => setPtype(e.target.value)}
          >
            <option value="">Select…</option>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Lot width / frontage (ft)
          </span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={frontage}
            onChange={(e) => setFrontage(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold" style={{ color: colors.heading }}>
            Lot depth (ft)
          </span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: colors.cardsBoarder }}
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            inputMode="decimal"
          />
        </label>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        style={{ backgroundColor: colors.icon, color: "#fff" }}
      >
        Run Sigma estimate
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
