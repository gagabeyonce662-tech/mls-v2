// components/homepage/HeroSection.tsx
"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { colors } from "@/config/design-system";
import { type Property, searchProperties } from "@/lib/api";

interface HeroSectionProps {
  onSearchStart: () => void;
  onSearchResults: (properties: Property[], query: string) => void;
}

export default function HeroSection({
  onSearchStart,
  onSearchResults,
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("Buy");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError("");
    onSearchStart();

    try {
      const query = searchQuery.trim();

      if (!query) {
        onSearchResults([], "");
        return;
      }

      const properties = await searchProperties(query);

      onSearchResults(properties, query);

      if (properties.length === 0) {
        setError(
          `No properties found matching "${query}". Try a different search term.`,
        );
      }
    } catch (error) {
      console.error("Error searching properties:", error);
      setError("Search failed. Please try again.");
      onSearchResults([], "");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setError("");
    onSearchResults([], "");
  };

  return (
    <section
      className="relative w-full bg-cover bg-center border-t border-b"
      style={{
        borderColor: colors.boarder,
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80')",
      }}
    >
      {/* dark overlay + subtle gradient */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-white/10 mix-blend-lighten"></div>
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/50 to-transparent"></div>
      </div>

      {/* main content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-6 md:pt-20 md:pb-8 lg:pt-24 lg:pb-10">
        <div className="max-w-3xl text-white/95 text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow">
            Find Your Place
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/85 max-w-xl">
            Watch listings, communities and custom areas. Stay informed when
            listings are added and sold.
          </p>

          {/* Search box */}
          <div className="mt-6">
            <div className="mx-auto mt-4 max-w-4xl">
              <div
                className="flex items-stretch rounded-full shadow-xl overflow-hidden ring-1 ring-black/5"
                style={{ backgroundColor: colors.cards }}
              >
                <label htmlFor="search" className="sr-only">
                  Search
                </label>

                <div className="flex-1 flex items-center gap-4 px-5">
                  <Search
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: colors.body }}
                  />
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by city, postal code, province, address, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full py-4 focus:outline-none bg-transparent"
                    style={{ color: colors.heading }}
                    disabled={isLoading}
                  />

                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="text-sm text-gray-500 hover:text-gray-700 px-2"
                      type="button"
                      disabled={isLoading}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div
                  className="flex items-center border-l px-3"
                  style={{ borderColor: colors.boarder }}
                >
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="appearance-none bg-transparent text-sm py-3 pr-6 pl-2 focus:outline-none cursor-pointer"
                    style={{ color: colors.heading }}
                    aria-label="Search Type"
                    disabled={isLoading}
                  >
                    <option value="Buy">Buy</option>
                    <option value="Rent">Rent</option>
                    <option value="Sell">Sell</option>
                  </select>
                  <ChevronDown
                    className="w-4 h-4 -ml-2 pointer-events-none"
                    style={{ color: colors.body }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-8 py-3 font-medium rounded-r-full flex items-center gap-3 shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.icon, color: colors.cards }}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
