// components/homepage/HeroSection.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { colors } from "@/config/design-system";

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("Buy");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (isLoading) return;

    setError("");

    try {
      const query = searchQuery.trim();

      if (!query) {
        setError("Please enter a city, postal code, or address.");
        return;
      }

      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("search", query);
      if (searchType === "Rent") {
        params.set("has_lease", "true");
      } else if (searchType === "Sell") {
        params.set("standard_status", "Sold");
      }
      const target = `/search-results?${params.toString()}`;
      if (typeof window !== "undefined") {
        window.location.assign(target);
      } else {
        router.push(target);
      }
    } catch (error) {
      console.error("Error searching properties:", error);
      setError("Search failed. Please try again.");
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
  };

  return (
    <section
      className="relative w-full overflow-hidden flex items-stretch"
      style={{ backgroundColor: colors.heading }}
    >
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
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Dual gradients: top-down for header contrast, bottom-up for content depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col justify-center pt-16 md:pt-24 lg:pt-28 pb-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-white font-extrabold leading-[1.1] tracking-tight drop-shadow-2xl">
              Toronto & GTA Homes for Sale, Rent & Pre-Construction
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90 font-medium max-w-2xl drop-shadow-lg">
              Discover your perfect property with Estate-4u. Real-time updates
              on active listings, exclusive rentals, and upcoming
              pre-construction projects across Ontario.
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
