"use client";

import React from "react";
import { Search, Loader2, X } from "lucide-react";
import { colors } from "@/config/design-system";

interface ListingSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export const ListingSearch = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  onClear,
  isLoading,
}: ListingSearchProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="mb-8 max-w-2xl mx-auto">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2"
            style={{ color: colors.body }}
          />
          <input
            type="text"
            placeholder="Search by city (e.g., Toronto, Vancouver, Ottawa)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full pl-12 pr-12 py-4 border rounded-xl focus:ring-2 text-lg shadow-sm"
            style={{
              borderColor: colors.boarder,
              color: colors.heading,
            }}
            disabled={isLoading}
          />
          {searchTerm && (
            <button
              onClick={onClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              style={{ color: colors.body }}
              type="button"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="px-6 py-4 rounded-xl transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: colors.primary, color: colors.cards }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          <span className="ml-2 hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
};
