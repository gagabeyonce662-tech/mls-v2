"use client";

import { useProvince } from "@/contexts/ProvinceContext";
import { fetchProperties, type PropertyFilterParams, type Property } from "@/lib/api";
import { useCallback } from "react";

/**
 * Custom hook that integrates province context with property API calls
 * Ensures all property searches respect the selected province
 */
export function useProvinceProperties() {
  const { selectedProvince, getProvinceName } = useProvince();

  /**
   * Fetch properties with automatic province filtering
   * @param additionalFilters - Optional additional filters to apply
   * @returns Promise<Property[]>
   */
  const fetchProvinceProperties = useCallback(async (
    additionalFilters: Omit<PropertyFilterParams, 'province'> = {}
  ): Promise<Property[]> => {
    const provinceName = getProvinceName(selectedProvince);
    
    const filters: PropertyFilterParams = {
      province: provinceName,
      ...additionalFilters
    };

    console.log('Fetching properties with province filter:', filters);
    return fetchProperties(filters);
  }, [selectedProvince]); // Remove getProvinceName dependency

  /**
   * Get the current province information
   */
  const getCurrentProvince = useCallback(() => {
    return {
      code: selectedProvince,
      name: getProvinceName(selectedProvince)
    };
  }, [selectedProvince]); // Remove getProvinceName dependency

  return {
    fetchProvinceProperties,
    getCurrentProvince,
    selectedProvince,
    provinceName: getProvinceName(selectedProvince)
  };
}