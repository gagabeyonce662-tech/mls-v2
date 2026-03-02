"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Canadian Provinces and Territories with proper API mapping
export const CANADIAN_PROVINCES = [
  { code: "ON", name: "Ontario", shortName: "ON" },
  { code: "QC", name: "Quebec", shortName: "QC" },
  { code: "BC", name: "British Columbia", shortName: "BC" },
  { code: "AB", name: "Alberta", shortName: "AB" },
  { code: "MB", name: "Manitoba", shortName: "MB" },
  { code: "SK", name: "Saskatchewan", shortName: "SK" },
  { code: "NS", name: "Nova Scotia", shortName: "NS" },
  { code: "NB", name: "New Brunswick", shortName: "NB" },
  { code: "NL", name: "Newfoundland and Labrador", shortName: "NL" },
  { code: "PE", name: "Prince Edward Island", shortName: "PE" },
  { code: "NT", name: "Northwest Territories", shortName: "NT" },
  { code: "NU", name: "Nunavut", shortName: "NU" },
  { code: "YT", name: "Yukon", shortName: "YT" },
];

interface ProvinceContextType {
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  getProvinceName: (code: string) => string;
  getProvinceCode: (name: string) => string;
  getAllProvinces: () => typeof CANADIAN_PROVINCES;
}

const ProvinceContext = createContext<ProvinceContextType | undefined>(
  undefined,
);

export function ProvinceProvider({ children }: { children: React.ReactNode }) {
  const [selectedProvince, setSelectedProvince] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedProvince = localStorage.getItem("selectedProvince");
      if (
        savedProvince &&
        CANADIAN_PROVINCES.some((p) => p.code === savedProvince)
      ) {
        return savedProvince;
      }
    }
    return "ON";
  }); // Default to Ontario

  // Save province to localStorage whenever it changes

  const handleSetSelectedProvince = React.useCallback((province: string) => {
    setSelectedProvince(province);
    localStorage.setItem("selectedProvince", province);
  }, []);

  const getProvinceName = React.useCallback((code: string): string => {
    const province = CANADIAN_PROVINCES.find((p) => p.code === code);
    return province ? province.name : code;
  }, []);

  const getProvinceCode = React.useCallback((name: string): string => {
    const province = CANADIAN_PROVINCES.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    return province ? province.code : name;
  }, []);

  const getAllProvinces = React.useCallback(() => CANADIAN_PROVINCES, []);

  return (
    <ProvinceContext.Provider
      value={{
        selectedProvince,
        setSelectedProvince: handleSetSelectedProvince,
        getProvinceName,
        getProvinceCode,
        getAllProvinces,
      }}
    >
      {children}
    </ProvinceContext.Provider>
  );
}

export function useProvince() {
  const context = useContext(ProvinceContext);
  if (context === undefined) {
    throw new Error("useProvince must be used within a ProvinceProvider");
  }
  return context;
}
