import {
  cityToSlug,
  joinWithAnd,
  PLACE_TYPE_NOUNS,
  placesByType,
} from "@/lib/city-pages";
import { countryName } from "@/lib/places-utils";
import { humanizeCity } from "@/lib/types";
import type { City, Place } from "@/lib/types";

/** One city inside a country page, with the slug of its existing `/city/<slug>` page. */
export interface CountryCity {
  city: City;
  /** URL slug for `/city/<slug>`. */
  slug: string;
  count: number;
}

/**
 * A country landing page's data: the code, its display name and every place
 * in it. Like the city pages, the dataset stays the single source of truth,
 * so there is no second country list to keep in step with `/stats` or the
 * map's country filter.
 */
export interface CountryPage {
  /** ISO 3166-1 alpha-2 code in capitals, as stored on each place ("IN"). */
  code: string;
  /** URL segment for `/country/<slug>`: the code in lowercase ("in"), the one canonical form. */
  slug: string;
  /** Display name ("India"). */
  name: string;
  places: Place[];
  /** The country's cities, biggest first, ties by name. */
  cities: CountryCity[];
}

/** Places listed under "Start here" on a country page. */
export const COUNTRY_TOP_PLACES = 6;

/** The one canonical URL segment for a country code. */
export function countrySlug(code: string): string {
  return code.trim().toLowerCase();
}

/**
 * Group the dataset by country. Places without a country (a visitor's own
 * private places never reach this) are left out, and a code that is not two
 * capital letters is ignored rather than becoming a page that could never be
 * linked to sensibly. Pages are ordered by display name.
 */
export function countryPages(places: readonly Place[]): CountryPage[] {
  const byCode = new Map<string, Place[]>();
  for (const place of places) {
    const code = place.country;
    if (!code || !/^[A-Z]{2}$/.test(code)) continue;
    const list = byCode.get(code);
    if (list) list.push(place);
    else byCode.set(code, [place]);
  }

  return Array.from(byCode, ([code, countryPlaces]): CountryPage => {
    const counts = new Map<City, number>();
    for (const place of countryPlaces) {
      counts.set(place.city, (counts.get(place.city) ?? 0) + 1);
    }
    const cities = Array.from(counts, ([city, count]) => ({
      city,
      slug: cityToSlug(city),
      count,
    })).sort(
      (a, b) =>
        b.count - a.count || humanizeCity(a.city).localeCompare(humanizeCity(b.city)),
    );
    return {
      code,
      slug: countrySlug(code),
      name: countryName(code),
      places: countryPlaces,
      cities,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/** Every slug, for `generateStaticParams`. */
export function countryPageSlugs(places: readonly Place[]): { code: string }[] {
  return countryPages(places).map(({ slug }) => ({ code: slug }));
}

/**
 * Find a country page by the raw segment Next hands a route. Only the
 * canonical lowercase form matches, so "/country/IN" and "/country/in" are
 * not two pages for the same content; anything else is undefined and the
 * caller answers 404.
 */
export function findCountryPage(
  places: readonly Place[],
  rawCode: string,
): CountryPage | undefined {
  return countryPages(places).find((page) => page.slug === rawCode);
}

/**
 * The page for the country a city sits in, using the country most of the
 * city's places name. Undefined for a city whose places carry no country.
 */
export function countryOfCity(
  places: readonly Place[],
  city: City,
): CountryPage | undefined {
  const counts = new Map<string, number>();
  for (const place of places) {
    if (place.city === city && place.country) {
      counts.set(place.country, (counts.get(place.country) ?? 0) + 1);
    }
  }
  let best: string | undefined;
  for (const [code, n] of counts) {
    if (best === undefined || n > (counts.get(best) ?? 0)) best = code;
  }
  return best ? countryPages(places).find((page) => page.code === best) : undefined;
}

/**
 * The places worth showing first: verified ones (most recently verified
 * first), then the rest in dataset order. Capped at `limit`.
 */
export function topPlaces(places: readonly Place[], limit = COUNTRY_TOP_PLACES): Place[] {
  const verified = places
    .filter((place) => place.verified)
    .sort((a, b) => (b.verified?.on ?? "").localeCompare(a.verified?.on ?? ""));
  const rest = places.filter((place) => !place.verified);
  return [...verified, ...rest].slice(0, limit);
}

/**
 * The meta description for a country page, built from what the country
 * actually has: the place total, a count per category present, and how many
 * cities, with nothing for the categories it lacks (same rule as the city
 * pages, #290).
 */
export function countryMetaDescription(page: CountryPage): string {
  const counts = placesByType(page.places).map(([type, grouped]) => {
    const [singular, plural] = PLACE_TYPE_NOUNS[type];
    return `${grouped.length} ${grouped.length === 1 ? singular : plural}`;
  });
  const total = page.places.length;
  const cityCount = page.cities.length;
  const summary =
    counts.length <= 1
      ? (counts[0] ?? "no places yet")
      : `${total} places (${joinWithAnd(counts)})`;
  return `Student-important places in ${page.name}: ${summary} across ${cityCount} ${
    cityCount === 1 ? "city" : "cities"
  }, on the crowdsourced StudyMap.`;
}
