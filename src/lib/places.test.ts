import { describe, expect, it } from "vitest";
import satCentres from "../../data/places/sat_centre.json";

import { cityBounds, filterPlaces, getCities } from "@/lib/places";
import { citiesInCountry, countryName, getCountries } from "@/lib/places-utils";
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
  place({
    id: "lib-1",
    name: "Central Library",
    type: "library",
    city: "mumbai",
    lat: 18.94,
    lng: 72.83,
  }),
  place({
    id: "lib-2",
    name: "Thane Public Library",
    type: "library",
    city: "thane",
    lat: 19.19,
    lng: 72.97,
  }),
  place({
    id: "book-1",
    name: "Old Book Depot",
    type: "sat_centre",
    city: "mumbai",
    lat: 18.95,
    lng: 72.84,
  }),
  place({
    id: "cafe-1",
    name: "Cyber Cafe",
    type: "foreign_lang_exam_centre",
    city: "navi_mumbai",
    lat: 19.03,
    lng: 73.02,
  }),
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
    const result = filterPlaces(FIXTURE, { types: ["library", "sat_centre"] });
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

  it("matches a query against the place name, ignoring accents", () => {
    const places = [
      place({ id: "esb", name: "Esenboğa International Airport", city: "ankara" }),
    ];
    expect(filterPlaces(places, { query: "esenboga" }).map((p) => p.id)).toEqual(["esb"]);
    expect(filterPlaces(places, { query: "Esenboğa" }).map((p) => p.id)).toEqual(["esb"]);
  });
});

describe("getCities", () => {
  it("orders cities by the given preferred order, alphabetically after that for the rest", () => {
    expect(getCities(FIXTURE, ["thane", "mumbai"])).toEqual([
      "thane",
      "mumbai",
      "navi_mumbai",
    ]);
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

describe("SAT centre city slugs", () => {
  it("keeps same-named North American centres out of unrelated city pages", () => {
    const expectedCities: Record<string, string> = {
      "96390": "london_ontario",
      "07330": "manchester_connecticut",
      "21171": "berlin_maryland",
      "33282": "cairo_new_york",
      "33154": "bedford_new_york",
      "39616": "reading_pennsylvania",
      "39740": "york_pennsylvania",
      "39744": "york_pennsylvania",
      "21100": "aberdeen_maryland",
      "07140": "bristol_connecticut",
      "07145": "bristol_connecticut",
      "21774": "salisbury_maryland",
      "87361": "southport_queensland",
    };

    for (const [id, city] of Object.entries(expectedCities)) {
      expect(satCentres.find((centre) => centre.id === id)?.city).toBe(city);
    }
    expect(satCentres.find((centre) => centre.id === "59096")?.city).toBe("arona");
  });
});

describe("country helpers", () => {
  const mk = (id: string, city: string, country?: string): Place => ({
    id,
    name: id,
    type: "library",
    city,
    country,
    lat: 0,
    lng: 0,
    gmaps_link: "https://maps.google.com/?q=0,0",
    added_by: "test",
  });
  const data = [
    mk("a", "mumbai", "IN"),
    mk("b", "nairobi", "KE"),
    mk("c", "pune", "IN"),
    mk("d", "x"),
  ];

  it("lists distinct countries sorted by display name, skipping places without one", () => {
    expect(getCountries(data)).toEqual(["IN", "KE"]);
  });

  it("names a country from its code and falls back to the code", () => {
    expect(countryName("IN")).toBe("India");
    expect(countryName("zz9")).toBe("zz9");
  });

  it("narrows the city list to a country, keeping order", () => {
    expect(citiesInCountry(data, ["pune", "nairobi", "mumbai", "x"], "IN")).toEqual([
      "pune",
      "mumbai",
    ]);
  });

  it("filters places by country", () => {
    expect(filterPlaces(data, { country: "KE" }).map((p) => p.id)).toEqual(["b"]);
    expect(filterPlaces(data, { country: "IN", city: "pune" }).map((p) => p.id)).toEqual([
      "c",
    ]);
  });
});
