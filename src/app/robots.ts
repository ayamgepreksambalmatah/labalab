import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Auto-serve di /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Halaman privat / non-indeks
      disallow: ["/dashboard", "/auth/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
