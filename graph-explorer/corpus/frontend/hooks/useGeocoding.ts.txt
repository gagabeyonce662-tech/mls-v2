import { useState, useRef } from "react";
import { NominatimResult } from "@/components/map/types";

export const useGeocoding = (
  inputRef: React.RefObject<HTMLInputElement | null>,
  onSelectCallback?: (result: {
    lat: number;
    lng: number;
    display_name: string;
  }) => void,
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchResult, setSearchResult] = useState<{
    lat: number;
    lng: number;
    display_name?: string;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const fetchResults = async (q: string) => {
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
      const data = (await res.json()) as NominatimResult[];
      setSearchResults(data ?? []);
      setResultsOpen(true);
      if (!data || data.length === 0) setSearchError("No results found.");
      setAnchorRect(inputRef.current?.getBoundingClientRect() ?? null);
    } catch (err) {
      console.error(err);
      setSearchError("Failed to fetch results. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const debounce = (fn: (...args: any[]) => void, delay: number) => {
    let timer: any;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const debouncedSearch = useRef(
    debounce((value: string) => {
      if (value.trim().length > 0) {
        fetchResults(value.trim());
      } else {
        setSearchResults([]);
        setResultsOpen(false);
      }
    }, 400),
  ).current;

  const onInputChange = (value: string) => {
    setSearchQuery(value);
    setSearchError(null);
    setResultsOpen(true);
    setAnchorRect(inputRef.current?.getBoundingClientRect() ?? null);
    debouncedSearch(value);
  };

  const selectResult = (r: NominatimResult) => {
    const lat = Number(r.lat);
    const lon = Number(r.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setSearchError("Invalid coordinates from geocoder");
      return;
    }

    const res = { lat, lng: lon, display_name: r.display_name };
    setSearchResult(res);
    setResultsOpen(false);
    setSearchResults([]);
    setSearchError(null);

    if (onSelectCallback) {
      onSelectCallback(res);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResult(null);
    setSearchError(null);
    setSearchResults([]);
    setResultsOpen(false);
  };

  return {
    searchQuery,
    searching,
    searchResults,
    searchResult,
    searchError,
    resultsOpen,
    anchorRect,
    setResultsOpen,
    setSearchResult,
    setSearchError,
    setSearchResults,
    onInputChange,
    selectResult,
    clearSearch,
    fetchResults,
    setAnchorRect,
  };
};
