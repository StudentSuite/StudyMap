import { describe, expect, it } from "vitest";

import { searchSite, searchSiteTotal, type SearchSiteData } from "@/lib/search";
import type { Competition, Place } from "@/lib/types";

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

function competition(overrides: Partial<Competition> & { id: string }): Competition {
  return {
    name: overrides.id,
    organizer: "Test Org",
    organizer_url: "https://example.com",
    category: "stem",
    subjects: [],
    description: "A test competition.",
    format: "online",
    age_min: 13,
    age_max: 18,
    participation: "individual",
    region: "international",
    fee: { amount: 0, currency: "USD" },
    prize: "None",
    official_url: "https://example.com",
    cycle_year: 2026,
    dates: [],
    added_by: "test",
    ...overrides,
  };
}

const PLACES: Place[] = [
  place({ id: "lib-1", name: "Central Library", city: "mumbai" }),
  place({ id: "lib-2", name: "Thane Public Library", city: "thane" }),
  place({ id: "book-1", name: "Old Book Depot", type: "sat_centre", city: "mumbai" }),
];

const COMPETITIONS: Competition[] = [
  competition({ id: "comp-1", name: "International Library Olympiad", organizer: "Book Foundation" }),
  competition({ id: "comp-2", name: "Math Bowl", organizer: "MathOrg", subjects: ["mathematics"] }),
];

const DOCS: SearchSiteData["docs"] = [
  { href: "/docs/map-controls", title: "Map Controls", description: "Zoom, pan, search, and filter the map." },
  { href: "/docs/faq", title: "FAQ", description: "Common questions about the library dataset and books." },
];

const DATA: SearchSiteData = { places: PLACES, competitions: COMPETITIONS, docs: DOCS };

describe("searchSite", () => {
  it("returns no groups for an empty query", () => {
    expect(searchSite("", DATA)).toEqual([]);
  });

  it("returns no groups for a whitespace-only query", () => {
    expect(searchSite("   ", DATA)).toEqual([]);
  });

  it("returns no groups when nothing matches", () => {
    expect(searchSite("xyzzy-nonexistent", DATA)).toEqual([]);
  });

  it("matches across all three content types for a shared term", () => {
    const groups = searchSite("library", DATA);
    const byType = Object.fromEntries(groups.map((g) => [g.type, g]));

    expect(byType.place?.results.map((r) => r.id)).toEqual(["lib-1", "lib-2"]);
    expect(byType.competition?.results.map((r) => r.id)).toEqual(["comp-1"]);
    expect(byType.doc?.results.map((r) => r.href)).toEqual(["/docs/faq"]);
  });

  it("is case-insensitive", () => {
    const upper = searchSite("LIBRARY", DATA);
    const lower = searchSite("library", DATA);
    expect(upper).toEqual(lower);
    expect(searchSiteTotal(upper)).toBeGreaterThan(0);
  });

  it("matches a place by its humanized city", () => {
    const groups = searchSite("thane", DATA);
    const places = groups.find((g) => g.type === "place");
    expect(places?.results.map((r) => r.id)).toEqual(["lib-2"]);
  });

  it("matches a competition by organizer or subject", () => {
    expect(searchSite("MathOrg", DATA).find((g) => g.type === "competition")?.results.map((r) => r.id)).toEqual([
      "comp-2",
    ]);
    expect(
      searchSite("mathematics", DATA).find((g) => g.type === "competition")?.results.map((r) => r.id),
    ).toEqual(["comp-2"]);
  });

  it("builds place/competition/doc hrefs following each route's own linking convention", () => {
    const groups = searchSite("library", DATA);
    const place = groups.find((g) => g.type === "place")!.results[0];
    const comp = groups.find((g) => g.type === "competition")!.results[0];
    const doc = groups.find((g) => g.type === "doc")!.results[0];

    expect(place.href).toBe("/map?place=lib-1");
    expect(comp.href).toBe("/competitions/comp-1");
    expect(doc.href).toBe("/docs/faq");
  });

  it("caps results per group and reports the true total separately", () => {
    const manyPlaces: Place[] = Array.from({ length: 12 }, (_, i) =>
      place({ id: `p-${i}`, name: `Library ${i}` }),
    );
    const groups = searchSite("library", { places: manyPlaces, competitions: [], docs: [] }, { limit: 5 });
    const places = groups.find((g) => g.type === "place")!;

    expect(places.total).toBe(12);
    expect(places.results).toHaveLength(5);
  });

  it("respects a custom limit", () => {
    const manyPlaces: Place[] = Array.from({ length: 12 }, (_, i) =>
      place({ id: `p-${i}`, name: `Library ${i}` }),
    );
    const groups = searchSite("library", { places: manyPlaces, competitions: [], docs: [] }, { limit: 2 });
    expect(groups.find((g) => g.type === "place")!.results).toHaveLength(2);
  });
});

describe("searchSiteTotal", () => {
  it("sums totals across groups", () => {
    const groups = searchSite("library", DATA);
    expect(searchSiteTotal(groups)).toBe(
      groups.reduce((sum, g) => sum + g.total, 0),
    );
  });

  it("is 0 for no groups", () => {
    expect(searchSiteTotal([])).toBe(0);
  });
});
