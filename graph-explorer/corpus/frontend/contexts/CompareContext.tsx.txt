"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface CompareContextType {
  compareList: any[];
  addToCompare: (property: any) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  isPropertySelected: (propertyId: string) => boolean;
  getPropertyKey: (property: any) => string;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
};

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [compareList, setCompareList] = useState<any[]>([]);

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
    const saved = localStorage.getItem("compare_list");
    if (saved) {
      try {
        setCompareList(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse compare list from localStorage", e);
      }
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("compare_list", JSON.stringify(compareList));
  }, [compareList]);

  const isPropertySelected = useCallback(
    (propertyId: string) => {
      return compareList.some((p) => getPropertyKey(p) === propertyId);
    },
    [compareList, getPropertyKey],
  );

  const addToCompare = useCallback(
    (property: any) => {
      const key = getPropertyKey(property);
      setCompareList((prev) => {
        if (prev.some((p) => getPropertyKey(p) === key)) return prev;
        if (prev.length >= 5) {
          // Optional: Notify user about limit
          return prev;
        }
        return [...prev, property];
      });
    },
    [getPropertyKey],
  );

  const removeFromCompare = useCallback(
    (propertyId: string) => {
      setCompareList((prev) =>
        prev.filter((p) => getPropertyKey(p) !== propertyId),
      );
    },
    [getPropertyKey],
  );

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isPropertySelected,
        getPropertyKey,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};
