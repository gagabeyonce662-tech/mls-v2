import { MetadataRoute } from "next";
import {
  fetchExclusiveProperties,
  fetchLeaseProperties,
  fetchPreConnProperties,
} from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://estate-4u.com";

  // Static routes
  const staticRoutes = [
    "",
    "/new-listings",
    "/map-search",
    "/blog",
    "/valuation",
    "/mortgage-calculator",
    "/tools",
    "/Precon",
    "/compare",
    "/watched",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Dynamic routes - Properties
  try {
    const [exclusive, lease, preConn] = await Promise.all([
      fetchExclusiveProperties({ limit: 50 }),
      fetchLeaseProperties({ limit: 50 }),
      fetchPreConnProperties({ limit: 50 }),
    ]);

    const exclusiveRoutes = (exclusive.results || []).map((p: any) => ({
      url: `${baseUrl}/listing/${p.listing_key || p.ListingKey}`,
      lastModified: new Date(p.ModificationTimestamp || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const leaseRoutes = (lease.results || []).map((p: any) => ({
      url: `${baseUrl}/listing/rental/${p.listing_key || p.ListingKey}`,
      lastModified: new Date(p.ModificationTimestamp || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const preConnRoutes = (preConn.results || []).map((p: any) => ({
      url: `${baseUrl}/Precon/${p.id || p.listing_key}`, // Adjusted based on precon folder structure if needed
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [
      ...staticRoutes,
      ...exclusiveRoutes,
      ...leaseRoutes,
      ...preConnRoutes,
    ];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticRoutes;
  }
}
