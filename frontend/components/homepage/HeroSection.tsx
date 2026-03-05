// components/homepage/HeroSection.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
      className="relative w-full overflow-hidden border-t border-b h-[320px] md:h-[380px] flex items-center -mt-[var(--header-height)] pt-[var(--header-height)]"
      style={{ borderColor: colors.boarder }}
    >
      {/* dark overlay + subtle gradient */}
      <div className="absolute inset-0 pointer-events-none" aria-hid
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
      {/* Animated Background Image (Ken Burns Effect) */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1.15 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        }}
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80')",
        }}
      />

      {/* Sophisticated Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
      </div>

      {/* Main Content Area - Intelligently pushed down to clear header but within full-bleed section */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-8 transition-all duration-300">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl text-white font-extrabold leading-tight tracking-tight drop-shadow-2xl">
              Toronto & GTA Homes for Sale, Rent & Pre-Construction
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90 font-medium max-w-2xl drop-shadow-lg">
              Discover your perfect property with Estate-4u. Real-time updates on active listings, exclusive rentals, and upcoming pre-construction projects across Ontario.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mt-6"
          >
            <div className="max-w-4xl group">
              <div
                className="flex flex-col md:flex-row items-stretch rounded-2xl md:rounded-full shadow-2xl overflow-hidden ring-1 ring-white/30 transition-all duration-300 focus-within:ring-4 focus-within:ring-white/20 backdrop-blur-xl"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
              >
                <div className="flex-1 flex items-center gap-4 px-6">
                  <Search className="w-5 h-5 text-white/80 shrink-0" />
                  <input
                    id="search"
                    type="text"
                    placeholder="City, postal code, or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full py-3 md:py-4 focus:outline-none bg-transparent text-lg placeholder:text-white/60 text-white"
                    disabled={isLoading}
                  />

                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="text-sm text-white/60 hover:text-white transition-colors px-2"
                      type="button"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center border-l border-white/20 px-4 md:px-6 bg-white/5">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="appearance-none bg-transparent text-white text-base py-3 md:py-4 pr-8 pl-2 focus:outline-none cursor-pointer font-medium"
                    aria-label="Search Type"
                  >
                    <option value="Buy" className="text-gray-900">
                      Buy
                    </option>
                    <option value="Rent" className="text-gray-900">
                      Rent
                    </option>
                    <option value="Sell" className="text-gray-900">
                      Sell
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 -ml-6 text-white/60 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-10 py-3 md:py-4 font-bold text-lg bg-ds-primary hover:bg-ds-primary/90 text-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      Searching
                    </div>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white rounded-2xl flex items-center gap-3 shadow-lg"
                >
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
