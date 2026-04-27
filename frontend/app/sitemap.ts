import { MetadataRoute } from "next";
export const revalidate = 3600; // Revalidate every hour

import {
  fetchExclusiveProperties,
  fetchLeaseProperties,
  fetchPreConnProperties,
  fetchVlogPosts,
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

  // Dynamic routes
  try {
    const [exclusive, lease, preConn, blogs] = await Promise.all([
      fetchExclusiveProperties({ limit: 50 }),
      fetchLeaseProperties({ limit: 50 }),
      fetchPreConnProperties({ limit: 50 }),
      fetchVlogPosts(),
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
      url: `${baseUrl}/Precon/${p.id || p.listing_key}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const blogRoutes = (blogs || []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at || post.created_at || new Date()),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    return [
      ...staticRoutes,
      ...exclusiveRoutes,
      ...leaseRoutes,
      ...preConnRoutes,
      ...blogRoutes,
    ];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticRoutes;
  }
}
