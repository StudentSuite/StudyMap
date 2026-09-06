import { humanizeCity, PLACE_TYPE_LABELS } from "@/lib/types";
import type { Competition, Place } from "@/lib/types";

/** The one place a doc entry's shape is imported for search, decoupled from `docsNav`'s own type. */
export interface SearchableDoc {
  href: string;
  title: string;
  description: string;
}

export type SearchResultType = "place" | "competition" | "doc";

export interface SearchResult {
  type: SearchResultType;
  /** Stable id within its type: the place/competition id, or the doc's href. */
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchGroup {
  type: SearchResultType;
  /** Group heading, e.g. "Places". */
  label: string;
  /** Every match, before the per-group cap is applied. */
  total: number;
  /** At most `limit` results (see `searchSite`'s `limit` option). */
  results: SearchResult[];
}

export interface SearchSiteData {
  places: Place[];
  competitions: Competition[];
  docs: SearchableDoc[];
}

export interface SearchSiteOptions {
  /** Results shown per group before "see all" applies. Defaults to 5. */
  limit?: number;
}

const DEFAULT_LIMIT = 5;

function includesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  return fields.some((field) => !!field && field.toLowerCase().includes(query));
}

/**
 * Searches places, competitions, and docs at once for the nav search
 * (issue #222). Pure and framework-free so it's cheap to unit test and can
 * run entirely client-side once the caller has the three datasets in hand
 * (`getPlaces()`, `getCompetitions()`, `docsNav`).
 *
 * Matching is a plain case-insensitive substring test per field (the same
 * approach as `filterPlaces` and the awesome-list docs browser) — no fuzzy
 * matching or ranking, since none of the three datasets are large enough to
 * need it and it keeps the behavior easy to reason about.
 *
 * An empty (or whitespace-only) query returns no groups at all, so callers
 * can show a neutral hint instead of a results list.
 */
export function searchSite(
  query: string,
  data: SearchSiteData,
  opts: SearchSiteOptions = {},
): SearchGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const limit = opts.limit ?? DEFAULT_LIMIT;

  const placeMatches = data.places.filter((place) =>
    includesQuery(q, place.name, humanizeCity(place.city), PLACE_TYPE_LABELS[place.type]),
  );
  const competitionMatches = data.competitions.filter((competition) =>
    includesQuery(
      q,
      competition.name,
      competition.organizer,
      competition.category,
      ...competition.subjects,
    ),
  );
  const docMatches = data.docs.filter((doc) =>
    includesQuery(q, doc.title, doc.description),
  );

  const groups: SearchGroup[] = [
    {
      type: "place",
      label: "Places",
      total: placeMatches.length,
      results: placeMatches.slice(0, limit).map((place) => ({
        type: "place",
        id: place.id,
        title: place.name,
        subtitle: `${humanizeCity(place.city)} · ${PLACE_TYPE_LABELS[place.type]}`,
        href: `/map?place=${encodeURIComponent(place.id)}`,
      })),
    },
    {
      type: "competition",
      label: "Competitions",
      total: competitionMatches.length,
      results: competitionMatches.slice(0, limit).map((competition) => ({
        type: "competition",
        id: competition.id,
        title: competition.name,
        subtitle: competition.organizer,
        href: `/competitions/${encodeURIComponent(competition.id)}`,
      })),
    },
    {
      type: "doc",
      label: "Docs",
      total: docMatches.length,
      results: docMatches.slice(0, limit).map((doc) => ({
        type: "doc",
        id: doc.href,
        title: doc.title,
        subtitle: doc.description,
        href: doc.href,
      })),
    },
  ];

  return groups.filter((group) => group.total > 0);
}

/** Total matches across all three groups, for e.g. a results count in the UI. */
export function searchSiteTotal(groups: SearchGroup[]): number {
  return groups.reduce((sum, group) => sum + group.total, 0);
}
