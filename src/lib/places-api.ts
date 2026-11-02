import { cityToSlug } from "@/lib/city-pages";
import { PLACE_TYPES } from "@/lib/types";
import type { City, Place, PlaceType } from "@/lib/types";

/**
 * Public API contract for GET /api/places. Kept separate from the route
 * handler so the whole contract (filtering, validation, pagination) is
 * unit-testable without HTTP.
 *
 * The dataset changes a few times a week at most, so the default limit is
 * generous but bounded: 100 rows, hard cap 500, offset for deep paging.
 */
export const PLACES_API_LIMITS = {
  defaultLimit: 100,
  maxLimit: 500,
} as const;

export interface PlacesQuery {
  city?: City;
  category?: PlaceType;
  /** Upper-case ISO 3166-1 alpha-2 code. */
  country?: string;
  limit: number;
  offset: number;
}

export interface PlacesQueryResult {
  /** Places matching the filters, sliced by limit/offset. */
  data: Place[];
  /** Matches before pagination, so consumers can page to the end. */
  total: number;
  limit: number;
  offset: number;
}

export type PlacesQueryParse =
  { ok: true; query: PlacesQuery } | { ok: false; error: string };

function isNonNegativeInteger(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Parse and validate the query string of GET /api/places.
 *
 * Strict by design: unknown categories and malformed country codes are
 * 400s with a message, never silently ignored — a consumer building on the
 * dataset should not have to guess why their filter matched nothing. The one
 * deliberate leniency is `limit`: values above the hard cap are clamped
 * (per the issue's own verification example) rather than rejected.
 */
export function parsePlacesQuery(params: URLSearchParams): PlacesQueryParse {
  if (params.getAll("city").length > 1) {
    return { ok: false, error: "city must be given at most once" };
  }
  if (params.getAll("category").length > 1) {
    return { ok: false, error: "category must be given at most once" };
  }
  if (params.getAll("country").length > 1) {
    return { ok: false, error: "country must be given at most once" };
  }
  if (params.getAll("limit").length > 1) {
    return { ok: false, error: "limit must be given at most once" };
  }
  if (params.getAll("offset").length > 1) {
    return { ok: false, error: "offset must be given at most once" };
  }

  const rawCity = params.get("city");
  let city: City | undefined;
  if (rawCity !== null) {
    if (rawCity.trim() === "") {
      return { ok: false, error: "city must not be empty" };
    }
    // Cities are stored as lowercase underscore slugs (e.g. "new_delhi");
    // accept the human-readable form and any casing, like the city pages do.
    city = cityToSlug(rawCity);
  }

  const rawCategory = params.get("category");
  let category: PlaceType | undefined;
  if (rawCategory !== null) {
    if (!(PLACE_TYPES as readonly string[]).includes(rawCategory)) {
      return {
        ok: false,
        error: `unknown category "${rawCategory}"; expected one of ${PLACE_TYPES.join(", ")}`,
      };
    }
    category = rawCategory as PlaceType;
  }

  const rawCountry = params.get("country");
  let country: string | undefined;
  if (rawCountry !== null) {
    if (rawCountry.trim() === "") {
      return { ok: false, error: "country must not be empty" };
    }
    // Stored as upper-case ISO 3166-1 alpha-2 codes; accept any casing.
    if (!/^[A-Za-z]{2}$/.test(rawCountry.trim())) {
      return {
        ok: false,
        error: `country must be a two-letter ISO 3166-1 alpha-2 code like "IN", got "${rawCountry}"`,
      };
    }
    country = rawCountry.trim().toUpperCase();
  }

  const rawLimit = params.get("limit");
  let limit: number = PLACES_API_LIMITS.defaultLimit;
  if (rawLimit !== null) {
    if (!isNonNegativeInteger(rawLimit) || Number(rawLimit) === 0) {
      return { ok: false, error: "limit must be a positive integer" };
    }
    limit = Math.min(Number(rawLimit), PLACES_API_LIMITS.maxLimit);
  }

  const rawOffset = params.get("offset");
  let offset = 0;
  if (rawOffset !== null) {
    if (!isNonNegativeInteger(rawOffset)) {
      return { ok: false, error: "offset must be a non-negative integer" };
    }
    offset = Number(rawOffset);
  }

  return { ok: true, query: { city, category, country, limit, offset } };
}

/**
 * Apply the parsed filters and pagination. `total` counts matches before
 * slicing so consumers know the full result set size.
 */
export function queryPlaces(
  places: Place[],
  { city, category, country, limit, offset }: PlacesQuery,
): PlacesQueryResult {
  const matches = places.filter(
    (place) =>
      (city === undefined || cityToSlug(place.city) === city) &&
      (category === undefined || place.type === category) &&
      (country === undefined || place.country === country),
  );
  return {
    data: matches.slice(offset, offset + limit),
    total: matches.length,
    limit,
    offset,
  };
}

/**
 * A 400 message when `query.country` is a well-formed code that no place
 * uses (a typo such as "ZZ"), so the consumer is told rather than handed an
 * empty list that looks like a bug. Null when the filter is absent or matches
 * at least one place.
 */
export function unknownCountryError(places: Place[], query: PlacesQuery): string | null {
  if (query.country === undefined) return null;
  if (places.some((place) => place.country === query.country)) return null;
  return `no places have country "${query.country}"; use an ISO 3166-1 alpha-2 code such as "IN"`;
}
