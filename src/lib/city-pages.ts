import { PLACE_TYPES } from "@/lib/types";
import type { City, Place, PlaceType } from "@/lib/types";

/**
 * A city landing page's data: the URL slug plus every place that belongs to
 * it. The dataset stays the single source of truth — no second city list.
 */
export interface CityPage {
  /** URL slug for `/city/<slug>`. For canonical city values, slug === city. */
  slug: string;
  /** The canonical city value from the dataset (first seen, in data order). */
  city: City;
  places: Place[];
}

/**
 * Normalize a city value into a URL-safe slug. City values are already
 * lowercase underscore slugs (per the schema), so this is identity for clean
 * values; it exists to catch data drift (spaces, hyphens, mixed case) so two
 * values that slugify identically are detected instead of silently merging.
 * Unicode letters are preserved (e.g. the Chinese city name 厦门 stays itself)
 * so no city ever collapses to an empty slug.
 */
export function cityToSlug(city: City): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Group every distinct city into a page. Slugs are derived from the `city`
 * field; if two different city values slugify to the same slug, that is a
 * data-quality collision and we fail loudly rather than silently merging the
 * two cities into one page.
 */
export function cityPages(places: Place[]): CityPage[] {
  const bySlug = new Map<string, { city: City; places: Place[] }>();
  for (const place of places) {
    const slug = cityToSlug(place.city);
    const entry = bySlug.get(slug);
    if (entry) {
      // Collision: the same slug from two distinct city values.
      if (entry.city !== place.city) {
        throw new Error(
          `City slug collision: "${entry.city}" and "${place.city}" both ` +
            `slugify to "${slug}". Fix the city values in the dataset so ` +
            `they do not collide before building.`,
        );
      }
      entry.places.push(place);
    } else {
      bySlug.set(slug, { city: place.city, places: [place] });
    }
  }
  return Array.from(bySlug, ([slug, { city, places }]) => ({
    slug,
    city,
    places,
  }));
}

/** Every slug, in dataset order, for `generateStaticParams`. */
export function cityPageSlugs(places: Place[]): { slug: string }[] {
  return cityPages(places).map(({ slug }) => ({ slug }));
}

/**
 * Find a city page by the raw slug Next hands a route (page or image file).
 * The segment may still be percent-encoded (e.g. "%E5%8E%A6%E9%97%A8" for
 * 厦门), so decode before comparing against dataset slugs; malformed
 * sequences fall back to the raw value. Returns undefined — not an error —
 * for slugs outside the dataset, leaving 404 policy to the caller.
 */
export function findCityPage(places: Place[], rawSlug: string): CityPage | undefined {
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // Keep the raw segment rather than throwing on malformed input.
  }
  return cityPages(places).find((candidate) => candidate.slug === slug);
}

/** A city's places grouped by type, in the canonical PLACE_TYPES order. */
export function placesByType(places: Place[]): [PlaceType, Place[]][] {
  return (
    PLACE_TYPES.map((type): [PlaceType, Place[]] => [
      type,
      places.filter((place) => place.type === type),
    ]) as [PlaceType, Place[]][]
  ).filter(([, grouped]) => grouped.length > 0);
}

/** Lower-case singular and plural nouns for each place type, used in sentences. */
const PLACE_TYPE_NOUNS: Record<PlaceType, [singular: string, plural: string]> = {
  library: ["library", "libraries"],
  other_places: ["other place", "other places"],
  airport: ["airport", "airports"],
  sat_centre: ["SAT centre", "SAT centres"],
  foreign_lang_exam_centre: [
    "foreign language exam centre",
    "foreign language exam centres",
  ],
  gov_offices: ["government office", "government offices"],
};

function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * The meta description for a city page, built from what the city actually
 * has: the total plus a count for each type present, and nothing for the
 * types it lacks. A one-place city reads in the singular.
 */
export function cityMetaDescription(name: string, places: Place[]): string {
  const counts = placesByType(places).map(([type, grouped]) => {
    const [singular, plural] = PLACE_TYPE_NOUNS[type];
    return `${grouped.length} ${grouped.length === 1 ? singular : plural}`;
  });
  const total = places.length;
  const summary =
    counts.length <= 1
      ? (counts[0] ?? "no places yet")
      : `${total} places (${joinWithAnd(counts)})`;
  return `Student-important places in ${name}: ${summary}, on the crowdsourced StudyMap.`;
}
