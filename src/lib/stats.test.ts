import { describe, expect, it } from "vitest";

import { computeStats } from "@/lib/stats";
import { getCompetitions } from "@/lib/competitions";
import { getPlaces } from "@/lib/places";
import type { Competition, Place } from "@/lib/types";

function place(overrides: Partial<Place>): Place {
  return {
    id: "x",
    name: "X",
    type: "library",
    city: "mumbai",
    country: "IN",
    lat: 0,
    lng: 0,
    gmaps_link: "https://maps.google.com",
    added_by: "alice",
    ...overrides,
  };
}

function competition(overrides: Partial<Competition>): Competition {
  return {
    id: "c",
    name: "C",
    organizer: "Org",
    organizer_url: "https://example.com",
    category: "stem",
    subjects: [],
    description: "",
    format: "online",
    age_min: 10,
    age_max: 18,
    participation: "individual",
    region: "international",
    fee: { type: "free" },
    prize: "",
    official_url: "https://example.com",
    cycle_year: 2026,
    dates: [],
    added_by: "carol",
    ...overrides,
  } as Competition;
}

describe("computeStats", () => {
  const places = [
    place({ id: "1", type: "library", city: "mumbai", country: "IN", added_by: "alice" }),
    place({ id: "2", type: "library", city: "mumbai", country: "IN", added_by: "alice" }),
    place({
      id: "3",
      type: "sat_centre",
      city: "navi_mumbai",
      country: "IN",
      added_by: "bob",
      verified: { by: "bob", on: "2026-10-01" },
    }),
    place({ id: "4", type: "airport", city: "london", country: "GB", added_by: "bob" }),
  ];
  const competitions = [
    competition({
      id: "a",
      category: "stem",
      region: "international",
      added_by: "carol",
    }),
    competition({ id: "b", category: "stem", region: "US", added_by: "alice" }),
    competition({ id: "c", category: "coding", region: "US", added_by: "carol" }),
  ];
  const stats = computeStats(places, competitions);

  it("counts the headline numbers", () => {
    expect(stats.placeCount).toBe(4);
    expect(stats.cityCount).toBe(3);
    expect(stats.countryCount).toBe(2);
    expect(stats.placeCategoryCount).toBe(3);
    expect(stats.verifiedPlaceCount).toBe(1);
    expect(stats.competitionCount).toBe(3);
    expect(stats.competitionCategoryCount).toBe(2);
  });

  it("counts a contributor once across both datasets", () => {
    expect(stats.contributorCount).toBe(3); // alice, bob, carol
  });

  it("ranks groups largest first with human labels", () => {
    expect(stats.places.category.map((r) => [r.label, r.count])).toEqual([
      ["Library", 2],
      ["Airport", 1],
      ["SAT centre", 1],
    ]);
    expect(stats.places.country.map((r) => [r.key, r.label, r.count])).toEqual([
      ["IN", "India", 3],
      ["GB", "United Kingdom", 1],
    ]);
    expect(stats.places.city[0]).toEqual({ key: "mumbai", label: "Mumbai", count: 2 });
  });

  it("breaks ties by label", () => {
    expect(stats.places.city.slice(1).map((r) => r.label)).toEqual([
      "London",
      "Navi Mumbai",
    ]);
  });

  it("names the international region and real countries", () => {
    expect(stats.competitions.region.map((r) => [r.label, r.count])).toEqual([
      ["United States", 2],
      ["International", 1],
    ]);
    expect(stats.competitions.category.map((r) => [r.label, r.count])).toEqual([
      ["STEM", 2],
      ["Coding", 1],
    ]);
  });

  it("skips places with no country in the country grouping", () => {
    const result = computeStats(
      [place({ country: undefined }), place({ country: "IN" })],
      [],
    );
    expect(result.places.country).toHaveLength(1);
    expect(result.countryCount).toBe(1);
    expect(result.placeCount).toBe(2);
  });

  it("handles empty datasets", () => {
    const empty = computeStats([], []);
    expect(empty.placeCount).toBe(0);
    expect(empty.contributorCount).toBe(0);
    expect(empty.places.city).toEqual([]);
  });

  it("every grouping sums to the dataset total on the real data", () => {
    const real = computeStats(getPlaces(), getCompetitions());
    const sum = (rows: { count: number }[]) => rows.reduce((n, r) => n + r.count, 0);
    expect(sum(real.places.category)).toBe(real.placeCount);
    expect(sum(real.places.city)).toBe(real.placeCount);
    expect(sum(real.places.country)).toBe(real.placeCount);
    expect(sum(real.competitions.category)).toBe(real.competitionCount);
    expect(sum(real.competitions.region)).toBe(real.competitionCount);
  });
});
