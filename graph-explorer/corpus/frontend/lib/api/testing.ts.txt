// lib/api/testing.ts
import { API_BASE_URL } from "./client";

/**
 * Test the exclusive properties endpoint
 */
export async function testExclusiveEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/exclusive-properties/`;
    const response = await fetch(testUrl);
    console.log("Test response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("Endpoint is working! Found", data.count || 0, "properties");
    }
  } catch (error) {
    console.error("Error testing exclusive endpoint:", error);
  }
}

/**
 * Test the lease properties endpoint
 */
export async function testLeaseEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/lease-properties/`;
    const response = await fetch(testUrl);
    console.log("Lease test response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log(
        "Lease endpoint is working! Found",
        data.count || 0,
        "properties",
      );
    }
  } catch (error) {
    console.error("Error testing lease endpoint:", error);
  }
}

/**
 * Test price range filtering
 */
export async function testPriceRangeEndpoint(
  minPrice?: number,
  maxPrice?: number,
): Promise<void> {
  try {
    const queryParams = new URLSearchParams();
    if (minPrice) queryParams.append("price_min", minPrice.toString());
    if (maxPrice) queryParams.append("price_max", maxPrice.toString());

    const testUrl = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    const response = await fetch(testUrl);

    if (response.ok) {
      const data = await response.json();
      console.log(
        "Price range test: Found",
        data?.results?.length || 0,
        "properties",
      );
    }
  } catch (error) {
    console.error("Error testing price range endpoint:", error);
  }
}

/**
 * Test MLS filter endpoint
 */
export async function testMLSFilterEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/filter/?province=Ontario&status=Active`;
    const response = await fetch(testUrl);

    if (response.ok) {
      const data = await response.json();
      console.log(
        "MLS filter test: Found",
        data?.value?.length || 0,
        "properties",
      );
    }
  } catch (error) {
    console.error("Error testing MLS filter endpoint:", error);
  }
}
