import type { MetadataRoute } from "next";

import { cityPages } from "@/lib/city-pages";
import { getCompetitions } from "@/lib/competitions";
import { getPlaces } from "@/lib/places";
import { site } from "@/lib/site";
import { docsPages } from "@/lib/docs-nav";
import { getChangelog } from "@/lib/changelog";
import type { Competition } from "@/lib/types";

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

/**
 * Real `lastModified` for one competition: `verified.on` when a contributor
 * has re-checked the record, else the most recent date the record itself
 * carries (the latest of its own `dates[]` entries) - never `new Date()`,
 * which is precisely the bug #163 exists for on the places side (every
 * deploy claiming every page changed, teaching crawlers to ignore lastmod).
 */
function competitionLastModified(competition: Competition): Date | undefined {
  if (competition.verified?.on) return new Date(competition.verified.on);
  const latest = competition.dates.map((date) => date.date).sort().at(-1);
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

  const competitions = getCompetitions();
  const competitionDetailEntries = competitions.map((competition) => {
    const lastModified = competitionLastModified(competition);
    return {
      url: `${site.url}/competitions/${competition.id}`,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  // The /competitions index itself: freshest of all the individual
  // competitions' real lastModified values, same reasoning as the docs
  // index sharing the latest changelog date rather than lying with
  // `new Date()`.
  const competitionsIndexLastModified = competitionDetailEntries
    .map((entry) => entry.lastModified)
    .filter((date): date is Date => date instanceof Date)
    .sort((a, b) => a.getTime() - b.getTime())
    .at(-1);

  const competitionEntries = [
    {
      url: `${site.url}/competitions`,
      ...(competitionsIndexLastModified
        ? { lastModified: competitionsIndexLastModified }
        : {}),
    },
    ...competitionDetailEntries,
  ];

  return [...staticEntries, ...docsEntries, ...cityEntries, ...competitionEntries];
}
