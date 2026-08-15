import { describe, expect, it } from "vitest";

import {
  parsePlacesQuery,
  PLACES_API_LIMITS,
  queryPlaces,
} from "@/lib/places-api";
import type { Place } from "@/lib/types";

function place(id: string, city: string, type: Place["type"] = "library"): Place {
  return {
    id,
    name: id,
    type,
    city,
    lat: 19.07,
    lng: 72.87,
    gmaps_link: "https://maps.google.com/?q=19.07,72.87",
    added_by: "test",
  };
}

const DATASET: Place[] = [
  place("mum-1", "mumbai", "library"),
  place("mum-2", "mumbai", "sat_centre"),
  place("nd-1", "new delhi", "library"),
  place("nd-2", "new delhi", "gov_offices"),
  place("ny-1", "new_york", "airport"),
];

function params(entries: [string, string][]): URLSearchParams {
  return new URLSearchParams(entries);
}

describe("parsePlacesQuery defaults", () => {
  it("applies the default limit and zero offset", () => {
    const parsed = parsePlacesQuery(params([]));
    expect(parsed).toEqual({
      ok: true,
      query: {
        city: undefined,
        category: undefined,
        limit: PLACES_API_LIMITS.defaultLimit,
        offset: 0,
      },
    });
  })

  it("clamps a limit above the hard maximum instead of dumping everything", () => {
    const parsed = parsePlacesQuery(params([["limit", "999999"]]));
    expect(parsed.ok && parsed.query.limit).toBe(PLACES_API_LIMITS.maxLimit);
  })
});

describe("parsePlacesQuery validation", () => {
  it("normalizes city to the dataset's lowercase underscore slug form", () => {
    const parsed = parsePlacesQuery(params([["city", "New Delhi"]]));
    expect(parsed.ok && parsed.query.city).toBe("new_delhi");
  })

  it("rejects an empty city", () => {
    const parsed = parsePlacesQuery(params([["city", "  "]]));
    expect(parsed.ok).toBe(false);
  })

  it("rejects an unknown category with the accepted enum", () => {
    const parsed = parsePlacesQuery(params([["category", "bookshop"]]));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toContain("library");
    }
  })

  it("accepts every PLACE_TYPES value as a category", () => {
    for (const category of [
      "library",
      "other_places",
      "airport",
      "sat_centre",
      "foreign_lang_exam_centre",
      "gov_offices",
    ]) {
      expect(parsePlacesQuery(params([["category", category]])).ok).toBe(true);
    }
  })

  it("rejects a country filter because the dataset has no country field", () => {
    const parsed = parsePlacesQuery(params([["country", "India"]]));
    expect(parsed.ok).toBe(false);
  })

  it("rejects malformed limit and offset values", () => {
    expect(parsePlacesQuery(params([["limit", "abc"]])).ok).toBe(false);
    expect(parsePlacesQuery(params([["limit", "0"]])).ok).toBe(false);
    expect(parsePlacesQuery(params([["limit", "-5"]])).ok).toBe(false);
    expect(parsePlacesQuery(params([["offset", "1.5"]])).ok).toBe(false);
    expect(parsePlacesQuery(params([["offset", "-1"]])).ok).toBe(false);
  })

  it("rejects repeated filter values instead of silently using one", () => {
    expect(
      parsePlacesQuery(
        params([
          ["city", "mumbai"],
          ["city", "thane"],
        ]),
      ).ok,
    ).toBe(false);
    expect(parsePlacesQuery(params([["limit", "5"], ["limit", "10"]])).ok).toBe(
      false,
    );
  })
});

describe("queryPlaces", () => {
  it("returns everything unpaginated when no filters apply", () => {
    const result = queryPlaces(DATASET, { limit: 100, offset: 0 });
    expect(result.total).toBe(5);
    expect(result.data).toHaveLength(5);
  })

  it("filters by city with slug normalization", () => {
    const result = queryPlaces(DATASET, { city: "new_delhi", limit: 100, offset: 0 });
    expect(result.data.map((p) => p.id)).toEqual(["nd-1", "nd-2"]);
  })

  it("filters by category", () => {
    const result = queryPlaces(DATASET, { category: "library", limit: 100, offset: 0 });
    expect(result.data.map((p) => p.id)).toEqual(["mum-1", "nd-1"]);
  })

  it("combines city and category filters", () => {
    const result = queryPlaces(DATASET, {
      city: "mumbai",
      category: "sat_centre",
      limit: 100,
      offset: 0,
    });
    expect(result.data.map((p) => p.id)).toEqual(["mum-2"]);
  })

  it("applies limit and offset with total reflecting the full match set", () => {
    const page = queryPlaces(DATASET, { limit: 2, offset: 1 });
    expect(page.data.map((p) => p.id)).toEqual(["mum-2", "nd-1"]);
    expect(page.total).toBe(5);
  })

  it("returns an empty page past the end without erroring", () => {
    const result = queryPlaces(DATASET, { limit: 100, offset: 100 });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(5);
  })

  it("returns an empty dataset unchanged", () => {
    const result = queryPlaces([], { limit: 100, offset: 0 });
    expect(result).toEqual({ data: [], total: 0, limit: 100, offset: 0 });
  })
});
