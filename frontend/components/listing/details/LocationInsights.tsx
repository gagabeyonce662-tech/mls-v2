"use client";

import { useEffect, useState } from "react";

import { fetchNearestSchools, fetchNearbyAmenities } from "@/lib/api";

import NearestSchoolsSection from "./NearestSchoolsSection";
import ListingAmenitiesSection from "./ListingAmenitiesSection";

interface LocationInsightsProps {
  latitude: number;
  longitude: number;
  schoolRadiusMeters?: number;
}

export default function LocationInsights({
  latitude,
  longitude,
  schoolRadiusMeters = 5000,
}: LocationInsightsProps) {
  const [nearestSchoolsData, setNearestSchoolsData] =
    useState<Awaited<ReturnType<typeof fetchNearestSchools>>>(null);

  const [nearbyAmenities, setNearbyAmenities] =
    useState<Awaited<ReturnType<typeof fetchNearbyAmenities>>>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [schoolFetchFailed, setSchoolFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLocationInsights() {
      setIsLoading(true);
      setSchoolFetchFailed(false);

      const [schoolsResult, amenitiesResult] = await Promise.allSettled([
        fetchNearestSchools(latitude, longitude, schoolRadiusMeters),
        fetchNearbyAmenities(latitude, longitude, 1800),
      ]);

      if (cancelled) {
        return;
      }

      if (schoolsResult.status === "fulfilled" && schoolsResult.value) {
        setNearestSchoolsData(schoolsResult.value);
      } else {
        setNearestSchoolsData(null);
        setSchoolFetchFailed(true);
      }

      if (amenitiesResult.status === "fulfilled" && amenitiesResult.value) {
        setNearbyAmenities(amenitiesResult.value);
      } else {
        setNearbyAmenities(null);
      }

      setIsLoading(false);
    }

    void loadLocationInsights();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, schoolRadiusMeters]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <>
      <NearestSchoolsSection
        schools={nearestSchoolsData?.nearest_schools || []}
        radiusMeters={nearestSchoolsData?.search_radius_m || schoolRadiusMeters}
        hasCoordinates={true}
        isUnavailable={schoolFetchFailed || !nearestSchoolsData}
      />

      <ListingAmenitiesSection amenities={nearbyAmenities} />
    </>
  );
}
