import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/_next", "/watched", "/compare"],
      },
    ],
    sitemap: "https://estate-4u.com/sitemap.xml",
  };
}
