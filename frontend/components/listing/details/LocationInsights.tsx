import { fetchNearestSchools, fetchNearbyAmenities } from "@/lib/api";

import NearestSchoolsSection from "./NearestSchoolsSection";
import ListingAmenitiesSection from "./ListingAmenitiesSection";

interface LocationInsightsProps {
  latitude: number;
  longitude: number;
  schoolRadiusMeters?: number;
}

export default async function LocationInsights({
  latitude,
  longitude,
  schoolRadiusMeters = 5000,
}: LocationInsightsProps) {
  let nearestSchoolsData: Awaited<ReturnType<typeof fetchNearestSchools>> =
    null;

  let nearbyAmenities: Awaited<ReturnType<typeof fetchNearbyAmenities>> = null;

  let schoolFetchFailed = false;

  try {
    [nearestSchoolsData, nearbyAmenities] = await Promise.all([
      fetchNearestSchools(latitude, longitude, schoolRadiusMeters),
      fetchNearbyAmenities(latitude, longitude, 1800),
    ]);
  } catch (error) {
    console.error("Failed to fetch location insights:", error);
    schoolFetchFailed = true;
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
