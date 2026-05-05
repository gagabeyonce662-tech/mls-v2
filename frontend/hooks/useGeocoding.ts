import { useState, useRef } from "react";
import { NominatimResult } from "@/components/map/types";

const ALLOWED_COUNTRY_CODES = new Set(["ca", "us"]);
/**
 * Domain coverage envelope:
 * - Full Canada
 * - Partial US near the northern border where listings may exist
 */
const DOMAIN_BOUNDS = {
  minLat: 24,
  maxLat: 84,
  minLng: -141,
  maxLng: -50,
};

const isWithinDomainBounds = (lat: number, lon: number) =>
  lat >= DOMAIN_BOUNDS.minLat &&
  lat <= DOMAIN_BOUNDS.maxLat &&
  lon >= DOMAIN_BOUNDS.minLng &&
  lon <= DOMAIN_BOUNDS.maxLng;

const isAllowedCountry = (result: NominatimResult) => {
  const code = (result.country_code ?? result.address?.country_code ?? "").toLowerCase();
  return ALLOWED_COUNTRY_CODES.has(code);
};

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
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(q)}` +
        `&format=json` +
        `&limit=10` +
        `&addressdetails=1` +
        `&countrycodes=ca,us`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
      const data = (await res.json()) as NominatimResult[];
      const filtered = (data ?? [])
        .filter((item) => {
          const lat = Number(item.lat);
          const lon = Number(item.lon);
          if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
          if (!isWithinDomainBounds(lat, lon)) return false;
          return isAllowedCountry(item);
        })
        .slice(0, 5);
      setSearchResults(filtered);
      setResultsOpen(true);
      if (!filtered || filtered.length === 0) {
        setSearchError("No results found in our service area (Canada + supported US locations).");
      }
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
    if (!isAllowedCountry(r) || !isWithinDomainBounds(lat, lon)) {
      setSearchError("That location is outside our service area.");
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
