import type { MetadataRoute } from "next";

import { cityPageSlugs } from "@/lib/city-pages";
import { getPlaces } from "@/lib/places";
import { site } from "@/lib/site";
import { docsPages } from "@/lib/docs-nav";

const STATIC_ROUTES = ["/", "/map", "/calendar", "/docs", "/about", "/contribute"];
const LEGAL_ROUTES = ["/legal/privacy", "/legal/terms", "/legal/disclaimer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const cityRoutes = cityPageSlugs(getPlaces()).map(
    ({ slug }) => `/city/${slug}`,
  );

  return [
    ...STATIC_ROUTES,
    ...docsPages.map((page) => page.href),
    ...LEGAL_ROUTES,
    ...cityRoutes,
  ].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
  }));
}
