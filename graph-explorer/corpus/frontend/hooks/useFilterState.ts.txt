"use client";

import { useState, useCallback } from "react";
import { ExclusivePropertyFilterParams, fetchExclusiveProperties } from "@/lib/api";

export function useFilterState() {
    const [searchQuery, setSearchQuery] = useState("");
    const [notifyFor, setNotifyFor] = useState("all");
    const [propertyType, setPropertyType] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState({ min: "", max: "" });
    const [bedrooms, setBedrooms] = useState("all");
    const [bathrooms, setBathrooms] = useState("all");
    const [garage, setGarage] = useState("all");
    const [squareFootage, setSquareFootage] = useState({ min: "", max: "" });
    const [lotSize, setLotSize] = useState({ min: "", max: "" });
    const [rentalYield, setRentalYield] = useState({ min: "", max: "" });
    const [schoolScore, setSchoolScore] = useState({ min: "", max: "" });
    const [basement, setBasement] = useState<string[]>([]);
    const [openHouse, setOpenHouse] = useState("unspecified");
    const [listingType, setListingType] = useState("all");
    const [hasPhotos, setHasPhotos] = useState<boolean | null>(null);
    const [limit, setLimit] = useState("50");

    const [isLoading, setIsLoading] = useState(false);

    const clearFilters = useCallback(() => {
        setSearchQuery("");
        setNotifyFor("all");
        setPropertyType([]);
        setPriceRange({ min: "", max: "" });
        setBedrooms("all");
        setBathrooms("all");
        setGarage("all");
        setSquareFootage({ min: "", max: "" });
        setLotSize({ min: "", max: "" });
        setRentalYield({ min: "", max: "" });
        setSchoolScore({ min: "", max: "" });
        setBasement([]);
        setOpenHouse("unspecified");
        setListingType("all");
        setHasPhotos(null);
        setLimit("50");
    }, []);

    const calculateActiveFilters = useCallback(() => {
        let count = 0;
        if (searchQuery) count++;
        if (notifyFor !== "all") count++;
        if (propertyType.length > 0) count++;
        if (priceRange.min || priceRange.max) count++;
        if (bedrooms !== "all") count++;
        if (bathrooms !== "all") count++;
        if (garage !== "all") count++;
        if (squareFootage.min || squareFootage.max) count++;
        if (lotSize.min || lotSize.max) count++;
        if (basement.length > 0) count++;
        if (listingType !== "all") count++;
        if (hasPhotos !== null) count++;
        return count;
    }, [searchQuery, notifyFor, propertyType, priceRange, bedrooms, bathrooms, garage, squareFootage, lotSize, basement, listingType, hasPhotos]);

    return {
        state: {
            searchQuery,
            notifyFor,
            propertyType,
            priceRange,
            bedrooms,
            bathrooms,
            garage,
            squareFootage,
            lotSize,
            rentalYield,
            schoolScore,
            basement,
            openHouse,
            listingType,
            hasPhotos,
            limit,
            isLoading,
        },
        setters: {
            setSearchQuery,
            setNotifyFor,
            setPropertyType,
            setPriceRange,
            setBedrooms,
            setBathrooms,
            setGarage,
            setSquareFootage,
            setLotSize,
            setRentalYield,
            setSchoolScore,
            setBasement,
            setOpenHouse,
            setListingType,
            setHasPhotos,
            setLimit,
            setIsLoading,
        },
        clearFilters,
        calculateActiveFilters,
    };
}
