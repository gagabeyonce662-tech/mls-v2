"use server";

import { mapPreconToProperty } from "@/lib/api/properties";
import { Property } from "@/lib/api/types";

/**
 * Dynamically fetch all Pre-Construction properties from WordPress
 * Executed purely on the Next.js server, taking advantage of the static fetch cache
 * so it won't repeatedly hit the WP instance.
 */
export async function fetchAllWPPreconPropertiesAction(): Promise<Property[]> {
  try {
    const res = await fetch(
      "https://estate-4u.com/wp-json/wp/v2/properties?per_page=100",
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapPreconToProperty);
  } catch (error) {
    console.error("Error fetching WP pre-cons:", error);
    return [];
  }
}

/**
 * Dynamically fetch a single Pre-Construction property from WordPress
 * Executed on the Next.js Server
 */
export async function fetchWPPreconPropertyAction(
  idStr: string,
): Promise<Property | null> {
  try {
    const res = await fetch(
      `https://estate-4u.com/wp-json/wp/v2/properties/${idStr}`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return mapPreconToProperty(data);
  } catch (error) {
    console.error("Error fetching single WP pre-con:", error);
    return null;
  }
}
