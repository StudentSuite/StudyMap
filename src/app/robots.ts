import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/login", "/offline"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
