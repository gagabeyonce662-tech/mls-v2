"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Property } from "@/lib/api";

interface SearchContextType {
  // Global search results (from Hero or big search bar)
  searchQuery: string;
  searchResults: Property[];
  isSearching: boolean;

  // Handlers
  startSearch: () => void;
  updateSearchResults: (results: Property[], query: string) => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Filter results (from PropertyFilter)
  filteredProperties: Property[];
  filterLabel: string;
  isFiltering: boolean;
  applyFilters: (properties: Property[], label?: string) => void;

  // View Mode (Grid vs Map)
  viewMode: "grid" | "map";
  toggleViewMode: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filterLabel, setFilterLabel] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "map" : "grid"));
  }, []);

  const startSearch = useCallback(() => {
    setIsSearching(true);
  }, []);

  const updateSearchResults = useCallback(
    (results: Property[], query: string) => {
      setSearchResults(results);
      setSearchQuery(query);
      setIsSearching(false);
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchQuery("");
    setIsSearching(false);
  }, []);

  const applyFilters = useCallback(
    (properties: Property[], label: string = "Filtered Properties") => {
      setFilteredProperties(properties);
      setFilterLabel(label);
      setIsFiltering(false);
    },
    [],
  );

  const value = {
    searchQuery,
    searchResults,
    isSearching,
    startSearch,
    updateSearchResults,
    setSearchQuery,
    clearSearch,
    filteredProperties,
    filterLabel,
    isFiltering,
    applyFilters,
    viewMode,
    toggleViewMode,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
