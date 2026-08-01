import type { MetadataRoute } from "next";

import { site } from "@/lib/site";
import { docsPages } from "@/lib/docs-nav";

const STATIC_ROUTES = ["/", "/map", "/calendar", "/docs", "/about", "/contribute"];
const LEGAL_ROUTES = ["/legal/privacy", "/legal/terms", "/legal/disclaimer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [...STATIC_ROUTES, ...docsPages.map((page) => page.href), ...LEGAL_ROUTES].map(
    (path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
    }),
  );
}
