"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { TrendingUp, BarChart3, PieChart, Map } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchListingTrends, type ListingTrendsResponse } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `$${Math.round(value).toLocaleString("en-CA")}`;
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export default function TrendsPage() {
  const [city, setCity] = useState("Ottawa");
  const [fsa, setFsa] = useState("");
  const [window, setWindow] = useState<"3m" | "6m" | "12m" | "24m">("12m");
  const [apiTarget, setApiTarget] = useState<"default" | "local" | "prod">("default");

  const baseUrl = useMemo(() => {
    if (apiTarget === "local") return "http://127.0.0.1:8000";
    if (apiTarget === "prod") return "https://mls-backend-v2.vercel.app";
    return undefined;
  }, [apiTarget]);

  const { data, isLoading, isError } = useQuery<ListingTrendsResponse | null>({
    queryKey: ["trends", city, fsa, window, apiTarget],
    queryFn: () =>
      fetchListingTrends({
        city: city.trim() || undefined,
        fsa: fsa.trim().toUpperCase() || undefined,
        window,
        baseUrl,
      }),
  });

  const latestPoint = useMemo(() => {
    if (!data?.series?.length) return null;
    for (let i = data.series.length - 1; i >= 0; i -= 1) {
      if (data.series[i].new_listings > 0) return data.series[i];
    }
    return data.series[data.series.length - 1];
  }, [data]);

  const pricingBandData = useMemo(() => {
    if (!data?.pricing) return [];
    return [
      { key: "P25", listPrice: data.pricing.list_price_p25 ?? 0, ppsf: data.pricing.price_per_sqft_p25 ?? 0 },
      { key: "P50", listPrice: data.pricing.list_price_p50 ?? 0, ppsf: data.pricing.price_per_sqft_p50 ?? 0 },
      { key: "P75", listPrice: data.pricing.list_price_p75 ?? 0, ppsf: data.pricing.price_per_sqft_p75 ?? 0 },
    ];
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-32 pb-20">
        <Container>
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-12 space-y-4">
              <div className="flex items-center gap-3 text-ds-primary">
                <TrendingUp className="w-6 h-6" />
                <span className="font-bold uppercase tracking-widest text-sm text-ds-primary">Market Intelligence</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-ds-heading tracking-tight">
                Real Estate Trends & Insights
              </h1>
              <p className="text-xl text-ds-body max-w-2xl font-inter">
                Sold-market trends for your selected market scope.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 grid md:grid-cols-4 gap-4">
              <input
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="City (e.g. Ottawa)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm uppercase"
                placeholder="FSA (optional, e.g. K1A)"
                value={fsa}
                onChange={(e) => setFsa(e.target.value)}
              />
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={window}
                onChange={(e) => setWindow(e.target.value as typeof window)}
              >
                <option value="3m">Last 3 months</option>
                <option value="6m">Last 6 months</option>
                <option value="12m">Last 12 months</option>
                <option value="24m">Last 24 months</option>
              </select>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={apiTarget}
                onChange={(e) => setApiTarget(e.target.value as typeof apiTarget)}
              >
                <option value="default">API: Default</option>
                <option value="local">API: Local (127.0.0.1:8000)</option>
                <option value="prod">API: Production</option>
              </select>
            </div>
            <div className="mb-8 text-xs text-ds-body flex items-center">
              Scope: {city || "—"} {fsa ? `· ${fsa.toUpperCase()}` : ""} · Source:{" "}
              {baseUrl || "NEXT_PUBLIC_API_URL"}
            </div>

            <div className="grid md:grid-cols-4 gap-8 mb-10">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading font-inter">Median Sold Price</h3>
                <p className="text-ds-body text-sm leading-relaxed font-inter">
                  {money(latestPoint?.median_list_price)}
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading font-inter">Median Sold $/sqft</h3>
                <p className="text-ds-body text-sm leading-relaxed font-inter">
                  {money(latestPoint?.median_price_per_sqft)}
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <Map className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading font-inter">Sold Listings (Latest)</h3>
                <p className="text-ds-body text-sm leading-relaxed font-inter">
                  {latestPoint?.new_listings ?? 0}
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading font-inter">Sold Volume (Window)</h3>
                <p className="text-ds-body text-sm leading-relaxed font-inter">
                  {data?.velocity?.active_current ?? 0}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ds-heading mb-3">Sold price trend</h2>
                {isLoading ? (
                  <p className="text-sm text-ds-body">Loading trends…</p>
                ) : isError || !data ? (
                  <p className="text-sm text-red-600">Could not load trend data.</p>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.series}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => `$${Math.round(value).toLocaleString("en-CA")}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="median_list_price"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ds-heading mb-3">Sold distribution by property type</h2>
                {isLoading ? (
                  <p className="text-sm text-ds-body">Loading inventory…</p>
                ) : isError || !data ? (
                  <p className="text-sm text-red-600">Could not load distribution.</p>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.subtype_distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mt-8">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ds-heading mb-3">Sold velocity (30d)</h2>
                {isLoading ? (
                  <p className="text-sm text-ds-body">Loading velocity…</p>
                ) : isError || !data?.velocity ? (
                  <p className="text-sm text-red-600">Could not load velocity metrics.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 p-3">
                      <p className="text-xs text-ds-body">Sold listings</p>
                      <p className="text-lg font-bold text-ds-heading">{data.velocity.new_listings_30d}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3">
                      <p className="text-xs text-ds-body">Modified listings</p>
                      <p className="text-lg font-bold text-ds-heading">{data.velocity.modifications_30d}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3">
                      <p className="text-xs text-ds-body">Inventory delta vs 30d</p>
                      <p className="text-lg font-bold text-ds-heading">
                        {data.velocity.active_delta_30d > 0 ? "+" : ""}
                        {data.velocity.active_delta_30d}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3">
                      <p className="text-xs text-ds-body">Current active</p>
                      <p className="text-lg font-bold text-ds-heading">{data.velocity.active_current}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ds-heading mb-3">Pricing bands (P25/P50/P75)</h2>
                {isLoading ? (
                  <p className="text-sm text-ds-body">Loading pricing bands…</p>
                ) : isError || !data?.pricing ? (
                  <p className="text-sm text-red-600">Could not load pricing bands.</p>
                ) : (
                  <>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pricingBandData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="key" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `$${Math.round(value).toLocaleString("en-CA")}`} />
                          <Bar dataKey="listPrice" fill="#2563eb" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-ds-body mt-2">
                      Spread index: {money(data.pricing.spread_index)}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mt-8">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ds-heading mb-3">Segmentation</h2>
                {isLoading ? (
                  <p className="text-sm text-ds-body">Loading segmentation…</p>
                ) : isError || !data?.segmentation ? (
                  <p className="text-sm text-red-600">Could not load segmentation.</p>
                ) : (
                  <div className="space-y-5">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.segmentation.by_bedrooms}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.segmentation.lease_vs_sale}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ds-heading mb-3">Site behavior (scope only)</h2>
                {isLoading ? (
                  <p className="text-sm text-ds-body">Loading activity…</p>
                ) : isError || !data?.behavior ? (
                  <p className="text-sm text-red-600">Could not load behavior trends.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-xs text-ds-body">Views 7d</p>
                        <p className="text-lg font-bold text-ds-heading">{data.behavior.views_7d}</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-xs text-ds-body">Views prev 7d</p>
                        <p className="text-lg font-bold text-ds-heading">{data.behavior.views_prev_7d}</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-xs text-ds-body">Saves 30d</p>
                        <p className="text-lg font-bold text-ds-heading">{data.behavior.saves_30d}</p>
                      </div>
                    </div>
                    <p className="text-sm text-ds-body">
                      Weekly view delta: {pct(data.behavior.views_delta_pct)}
                    </p>
                    <div>
                      <h3 className="text-sm font-semibold text-ds-heading mb-2">Rising listings</h3>
                      <div className="space-y-2 max-h-48 overflow-auto">
                        {data.behavior.rising_listings.length === 0 ? (
                          <p className="text-xs text-ds-body">No strong upward movers this week.</p>
                        ) : (
                          data.behavior.rising_listings.map((item) => (
                            <div key={item.listing_key} className="rounded-lg border border-gray-100 p-2 text-xs">
                              <span className="font-semibold">{item.listing_key}</span>
                              <span className="text-ds-body"> · 7d {item.views_7d} vs prev {item.views_prev_7d} · Δ {item.delta}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    {data.behavior.note ? (
                      <p className="text-xs text-ds-body">{data.behavior.note}</p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mt-8">
              <h2 className="text-xl font-bold text-ds-heading mb-3">Data confidence</h2>
              {isLoading ? (
                <p className="text-sm text-ds-body">Loading coverage metrics…</p>
              ) : isError || !data?.confidence ? (
                <p className="text-sm text-red-600">Could not load confidence metrics.</p>
              ) : (
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-xs text-ds-body">Sample size</p>
                    <p className="text-lg font-bold text-ds-heading">{data.confidence.sample_size}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-xs text-ds-body">With living area</p>
                    <p className="text-lg font-bold text-ds-heading">{pct(data.confidence.pct_with_living_area)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-xs text-ds-body">With list price</p>
                    <p className="text-lg font-bold text-ds-heading">{pct(data.confidence.pct_with_list_price)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-xs text-ds-body">Updated in 30d</p>
                    <p className="text-lg font-bold text-ds-heading">{pct(data.confidence.pct_recently_updated_30d)}</p>
                  </div>
                </div>
              )}
            </div>
            {data?.disclaimer ? (
              <p className="mt-6 text-xs text-ds-body">{data.disclaimer}</p>
            ) : null}
            {data?.freshness?.last_successful_sync_at ? (
              <p className="mt-1 text-xs text-ds-body">
                Last sold sync: {new Date(data.freshness.last_successful_sync_at).toLocaleString("en-CA")}
              </p>
            ) : null}
            {data?.warning ? (
              <p className="mt-1 text-xs text-orange-700">{data.warning}</p>
            ) : null}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
