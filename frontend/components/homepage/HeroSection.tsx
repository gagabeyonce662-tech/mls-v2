"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { colors } from "@/config/design-system";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("Buy");

  return (
    <section
      className="relative w-full bg-cover bg-center border-t border-b"
      style={{
        borderColor: colors.boarder,
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80')",
      }}
    >
      {/* top navbar (minimal to match design) */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/90 rounded-md flex items-center justify-center shadow-sm">
                  <span className="font-bold" style={{ color: colors.primary }}>CR</span>
                </div>
                <span className="hidden md:inline font-semibold text-white drop-shadow">LOGOIPSUM</span>
              </div>

              <nav className="hidden md:flex items-center gap-6 text-sm text-white/90">
                <a className="hover:underline" href="#">Map Search</a>
                <a className="hover:underline" href="#">Trends</a>
                <a className="hover:underline" href="#">Home Valuation</a>
                <a className="hover:underline" href="#">Agents</a>
                <a className="hover:underline" href="#">Tools</a>
                <a className="hover:underline" href="#">Watched</a>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden md:inline px-3 py-1 rounded bg-white/90 font-medium" style={{ color: colors.primary }}>Login</button>
              <button className="px-3 py-2 rounded font-medium shadow" style={{ backgroundColor: colors.primary, color: colors.cards }}>Get Started</button>
            </div>
          </div>
        </div>
      </header>

      {/* dark overlay + subtle gradient to better match screenshot */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-white/20 mix-blend-lighten"></div>
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/40 to-transparent"></div>
      </div>

      {/* main content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-28 lg:py-32">
        <div className="max-w-3xl text-white/95">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow">
            Find Your Place
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-xl">
            Watch listings, communities and custom areas. Stay informed when listings are added and sold.
          </p>

          {/* Search box centered and overlapping the hero like the design */}
          <div className="mt-8">
            <div className="mx-auto mt-6 max-w-4xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // invoke search
                  console.log({ searchQuery, searchType });
                }}
                className="flex items-stretch rounded-full shadow-xl overflow-hidden ring-1 ring-black/5"
                style={{ backgroundColor: colors.cards }}
              >
                <label htmlFor="search" className="sr-only">Search</label>

                <div className="flex-1 flex items-center gap-4 px-5">
                  <Search className="w-5 h-5 flex-shrink-0" style={{ color: colors.body }} />
                  <input
                    id="search"
                    type="text"
                    placeholder="Enter city, neighbourhood, or address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-4 focus:outline-none bg-transparent"
                    style={{ color: colors.heading }}
                  />
                </div>

                <div className="flex items-center border-l px-3" style={{ borderColor: colors.boarder }}>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="appearance-none bg-transparent text-sm py-3 pr-6 pl-2 focus:outline-none cursor-pointer"
                    style={{ color: colors.heading }}
                    aria-label="Search Type"
                  >
                    <option value="Buy">Buy</option>
                    <option value="Rent">Rent</option>
                    <option value="Sell">Sell</option>
                  </select>
                  <ChevronDown className="w-4 h-4 -ml-2 pointer-events-none" style={{ color: colors.body }} />
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 font-medium rounded-r-full flex items-center gap-3 shadow-md transition-opacity hover:opacity-90"
                  style={{ backgroundColor: colors.icon, color: colors.cards }}
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* spacing at bottom so hero feels like the screenshot */}
      <div className="h-8 md:h-12 lg:h-16" />
    </section>
  );
}
