"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface WatchedContextType {
  favoritesList: any[];
  historyList: any[];
  toggleFavorite: (property: any) => void;
  addToHistory: (property: any) => void;
  isFavorite: (propertyId: string) => boolean;
  clearFavorites: () => void;
  clearHistory: () => void;
  getPropertyKey: (property: any) => string;
}

const WatchedContext = createContext<WatchedContextType | undefined>(undefined);

export const useWatched = () => {
  const context = useContext(WatchedContext);
  if (!context) {
    throw new Error("useWatched must be used within a WatchedProvider");
  }
  return context;
};

export const WatchedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favoritesList, setFavoritesList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Helper to get consistent keys
  const getPropertyKey = useCallback((property: any) => {
    return (
      property?.listing_key ||
      property?.PropertyKey ||
      property?.id ||
      String(property?.ListingId || "") ||
      `property-${property?.city || "unknown"}-${property?.list_price || property?.ListPrice || "0"}`
    );
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFavorites = localStorage.getItem("favorite_properties");
      const savedHistory = localStorage.getItem("history_properties");

      if (savedFavorites) {
        try {
          setFavoritesList(JSON.parse(savedFavorites));
        } catch (e) {
          console.error(e);
        }
      }
      if (savedHistory) {
        try {
          setHistoryList(JSON.parse(savedHistory));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("favorite_properties", JSON.stringify(favoritesList));
  }, [favoritesList]);

  useEffect(() => {
    localStorage.setItem("history_properties", JSON.stringify(historyList));
  }, [historyList]);

  const isFavorite = useCallback(
    (propertyId: string) => {
      return favoritesList.some((p) => getPropertyKey(p) === propertyId);
    },
    [favoritesList, getPropertyKey],
  );

  const toggleFavorite = useCallback(
    (property: any) => {
      const key = getPropertyKey(property);
      setFavoritesList((prev) => {
        const exists = prev.some((p) => getPropertyKey(p) === key);
        if (exists) {
          return prev.filter((p) => getPropertyKey(p) !== key);
        }
        return [property, ...prev];
      });
    },
    [getPropertyKey],
  );

  const addToHistory = useCallback(
    (property: any) => {
      const key = getPropertyKey(property);
      setHistoryList((prev) => {
        // Remove if already exists to move to top
        const filtered = prev.filter((p) => getPropertyKey(p) !== key);
        return [property, ...filtered].slice(0, 50); // Keep last 50
      });
    },
    [getPropertyKey],
  );

  const clearFavorites = useCallback(() => setFavoritesList([]), []);
  const clearHistory = useCallback(() => setHistoryList([]), []);

  return (
    <WatchedContext.Provider
      value={{
        favoritesList,
        historyList,
        toggleFavorite,
        addToHistory,
        isFavorite,
        clearFavorites,
        clearHistory,
        getPropertyKey,
      }}
    >
      {children}
    </WatchedContext.Provider>
  );
};
