import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Auto-serve di /sitemap.xml
export default function sitemap(): MetadataRoute.Sitemap {
  // Hanya halaman publik yang layak diindeks (dashboard privat dikecualikan).
  const routes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/register", priority: 0.6, changeFrequency: "monthly" as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency,
    priority,
  }));
}
