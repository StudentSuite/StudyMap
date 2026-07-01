import { describe, expect, it } from "vitest";

import { cityBounds, filterPlaces, getCities } from "@/lib/places";
import type { Place } from "@/lib/types";

function place(overrides: Partial<Place> & { id: string }): Place {
  return {
    name: overrides.id,
    type: "library",
    city: "mumbai",
    lat: 19,
    lng: 72.9,
    gmaps_link: "https://maps.google.com/?q=19,72.9",
    added_by: "test",
    ...overrides,
  };
}

const FIXTURE: Place[] = [
  place({ id: "lib-1", name: "Central Library", type: "library", city: "mumbai", lat: 18.94, lng: 72.83 }),
  place({ id: "lib-2", name: "Thane Public Library", type: "library", city: "thane", lat: 19.19, lng: 72.97 }),
  place({ id: "book-1", name: "Old Book Depot", type: "book_shop", city: "mumbai", lat: 18.95, lng: 72.84 }),
  place({ id: "cafe-1", name: "Cyber Cafe", type: "internet_cafe", city: "navi_mumbai", lat: 19.03, lng: 73.02 }),
];

describe("filterPlaces", () => {
  it("returns every place when no filters are given", () => {
    expect(filterPlaces(FIXTURE, {})).toHaveLength(FIXTURE.length);
  });

  it("filters by a single type", () => {
    const result = filterPlaces(FIXTURE, { types: ["library"] });
    expect(result.map((p) => p.id)).toEqual(["lib-1", "lib-2"]);
  });

  it("filters by multiple types", () => {
    const result = filterPlaces(FIXTURE, { types: ["library", "book_shop"] });
    expect(result.map((p) => p.id)).toEqual(["lib-1", "lib-2", "book-1"]);
  });

  it("filters by city", () => {
    const result = filterPlaces(FIXTURE, { city: "thane" });
    expect(result.map((p) => p.id)).toEqual(["lib-2"]);
  });

  it("matches a query against the place name, case-insensitively", () => {
    const result = filterPlaces(FIXTURE, { query: "book depot" });
    expect(result.map((p) => p.id)).toEqual(["book-1"]);
  });

  it("matches a query against the city, ignoring underscores", () => {
    const result = filterPlaces(FIXTURE, { query: "navi mumbai" });
    expect(result.map((p) => p.id)).toEqual(["cafe-1"]);
  });

  it("combines type, city, and query filters with AND semantics", () => {
    const result = filterPlaces(FIXTURE, {
      types: ["library"],
      city: "mumbai",
      query: "central",
    });
    expect(result.map((p) => p.id)).toEqual(["lib-1"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterPlaces(FIXTURE, { query: "does not exist" })).toEqual([]);
  });
});

describe("getCities", () => {
  it("orders cities by the given preferred order, alphabetically after that for the rest", () => {
    expect(getCities(FIXTURE, ["thane", "mumbai"])).toEqual(["thane", "mumbai", "navi_mumbai"]);
  });

  it("falls back to alphabetical order when no preferred order is given", () => {
    expect(getCities(FIXTURE, [])).toEqual(["mumbai", "navi_mumbai", "thane"]);
  });

  it("defaults to studymap.config.ts's cities registry order", () => {
    expect(getCities(FIXTURE)).toEqual(["mumbai", "thane", "navi_mumbai"]);
  });

  it("returns an empty array for no places", () => {
    expect(getCities([])).toEqual([]);
  });
});

describe("cityBounds", () => {
  it("returns null for a city with no places", () => {
    expect(cityBounds(FIXTURE, "pune")).toBeNull();
  });

  it("returns a single-point box for a city with one place", () => {
    expect(cityBounds(FIXTURE, "thane")).toEqual({
      minLat: 19.19,
      maxLat: 19.19,
      minLng: 72.97,
      maxLng: 72.97,
    });
  });

  it("returns the bounding box spanning every place in the city", () => {
    expect(cityBounds(FIXTURE, "mumbai")).toEqual({
      minLat: 18.94,
      maxLat: 18.95,
      minLng: 72.83,
      maxLng: 72.84,
    });
  });
});
