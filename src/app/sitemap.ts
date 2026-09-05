import type { MetadataRoute } from "next";

import { cityPages } from "@/lib/city-pages";
import { getPlaces } from "@/lib/places";
import { site } from "@/lib/site";
import { docsPages } from "@/lib/docs-nav";
import { getChangelog } from "@/lib/changelog";

const STATIC_ROUTES = ["/", "/map", "/calendar", "/docs", "/about", "/contribute"];
const LEGAL_ROUTES = ["/legal/privacy", "/legal/terms", "/legal/disclaimer"];

/** Newest `verified.on` date among a city's places, or undefined if none are verified. */
function newestVerifiedOn(places: { verified?: { on: string } }[]): Date | undefined {
  const dates = places
    .map((place) => place.verified?.on)
    .filter((on): on is string => Boolean(on))
    .sort();
  const latest = dates.at(-1);
  return latest ? new Date(latest) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Docs content is hand-authored and not individually dated, so the latest
  // dated CHANGELOG.md release is the closest real signal for "last modified".
  const [latestRelease] = getChangelog();
  const docsLastModified = latestRelease ? new Date(latestRelease.date) : undefined;

  const staticEntries = [...STATIC_ROUTES, ...LEGAL_ROUTES].map((path) => ({
    url: `${site.url}${path}`,
  }));

  const docsEntries = docsPages.map((page) => ({
    url: `${site.url}${page.href}`,
    ...(docsLastModified ? { lastModified: docsLastModified } : {}),
  }));

  const cityEntries = cityPages(getPlaces()).map(({ slug, places }) => {
    const lastModified = newestVerifiedOn(places);
    return {
      url: `${site.url}/city/${slug}`,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  return [...staticEntries, ...docsEntries, ...cityEntries];
}
