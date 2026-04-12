"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { TrendingUp, BarChart3, PieChart, Users, Map, Info } from "lucide-react";
import { colors } from "@/config/design-system";

export default function TrendsPage() {
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
                Stay updated with the latest market data, inventory levels, and price movements across the GTA.
              </p>
            </div>

            {/* Coming Soon Feature */}
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading font-inter">Price Analysis</h3>
                <p className="text-ds-body text-sm leading-relaxed font-inter"> Historical price data and future projections for detached, semi-detached, and condo units.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading font-inter">Inventory Levels</h3>
                <p className="text-ds-body text-sm leading-relaxed font-inter">Real-time tracking of active listings versus properties sold to gauge market heat.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <Map className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading font-inter">Neighborhood Heatmaps</h3>
                <p className="text-ds-body text-sm leading-relaxed font-inter">Visual maps showing where the market is most active and where the best deals are.</p>
              </div>
            </div>

            {/* Big Feature Section */}
            <div className="relative rounded-[3rem] bg-indigo-950 p-12 overflow-hidden text-white shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp className="w-64 h-64" />
              </div>
              <div className="relative z-10 max-w-2xl space-y-6">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">In Development</span>
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold leading-tight">Advanced Analytics Platform</h2>
                 <p className="text-lg opacity-80 leading-relaxed font-inter">
                   We are building a proprietary data engine that connects your property searches with deep market insights. 
                   Soon, you'll be able to see "Days on Market" and "Sold-over-Asking" averages directly on listings.
                 </p>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
