import { describe, expect, it } from "vitest";

import {
  COUNTRY_TOP_PLACES,
  countryMetaDescription,
  countryOfCity,
  countryPageSlugs,
  countryPages,
  countrySlug,
  findCountryPage,
  topPlaces,
} from "@/lib/country-pages";
import { getPlaces } from "@/lib/places";
import { computeStats } from "@/lib/stats";
import type { Place } from "@/lib/types";

function place(
  id: string,
  city: string,
  country: string | undefined,
  overrides: Partial<Place> = {},
): Place {
  return {
    id,
    name: id,
    type: "library",
    city,
    ...(country ? { country } : {}),
    lat: 1,
    lng: 2,
    gmaps_link: "https://maps.google.com/?q=1,2",
    added_by: "test",
    ...overrides,
  };
}

const DATASET: Place[] = [
  place("mum-1", "mumbai", "IN"),
  place("mum-2", "mumbai", "IN", { type: "airport" }),
  place("mum-3", "mumbai", "IN"),
  place("thane-1", "thane", "IN"),
  place("nbo-1", "nairobi", "KE", { type: "sat_centre" }),
  place("own-1", "mumbai", undefined),
];

describe("countrySlug", () => {
  it("is the lowercase code, the one canonical form", () => {
    expect(countrySlug("IN")).toBe("in");
    expect(countrySlug(" gb ")).toBe("gb");
  });
});

describe("countryPages", () => {
  it("makes one page per country, ordered by display name", () => {
    const pages = countryPages(DATASET);
    expect(pages.map((p) => p.code)).toEqual(["IN", "KE"]);
    expect(pages.map((p) => p.name)).toEqual(["India", "Kenya"]);
    expect(pages.map((p) => p.slug)).toEqual(["in", "ke"]);
  });

  it("leaves out places with no country", () => {
    const pages = countryPages(DATASET);
    expect(pages.flatMap((p) => p.places.map((x) => x.id))).not.toContain("own-1");
  });

  it("ignores a code that is not two capital letters", () => {
    const pages = countryPages([
      place("a", "x", "in"),
      place("b", "x", "IND"),
      place("c", "x", "I"),
      place("d", "x", "IN"),
    ]);
    expect(pages.map((p) => p.code)).toEqual(["IN"]);
    expect(pages[0].places.map((p) => p.id)).toEqual(["d"]);
  });

  it("lists the cities biggest first, ties by name, each with its city page slug", () => {
    const [india] = countryPages(DATASET);
    expect(india.cities).toEqual([
      { city: "mumbai", slug: "mumbai", count: 3 },
      { city: "thane", slug: "thane", count: 1 },
    ]);

    const tied = countryPages([place("a", "pune", "IN"), place("b", "delhi", "IN")]);
    expect(tied[0].cities.map((c) => c.city)).toEqual(["delhi", "pune"]);
  });

  it("returns nothing for an empty dataset", () => {
    expect(countryPages([])).toEqual([]);
  });
});

describe("findCountryPage", () => {
  it("finds a page by its canonical lowercase segment", () => {
    expect(findCountryPage(DATASET, "in")?.name).toBe("India");
  });

  it("is undefined for an unknown code, so the page can answer 404", () => {
    expect(findCountryPage(DATASET, "zz")).toBeUndefined();
    expect(findCountryPage(DATASET, "")).toBeUndefined();
    expect(findCountryPage(DATASET, "../in")).toBeUndefined();
  });

  it("does not answer to the uppercase form, so there is one canonical URL", () => {
    expect(findCountryPage(DATASET, "IN")).toBeUndefined();
  });
});

describe("countryPageSlugs", () => {
  it("lists one lowercase code per country", () => {
    expect(countryPageSlugs(DATASET)).toEqual([{ code: "in" }, { code: "ke" }]);
  });
});

describe("countryOfCity", () => {
  it("finds the country a city sits in", () => {
    expect(countryOfCity(DATASET, "nairobi")?.code).toBe("KE");
    expect(countryOfCity(DATASET, "thane")?.name).toBe("India");
  });

  it("uses the country most of the city's places name", () => {
    const mixed = [
      place("a", "springfield", "US"),
      place("b", "springfield", "US"),
      place("c", "springfield", "GB"),
    ];
    expect(countryOfCity(mixed, "springfield")?.code).toBe("US");
  });

  it("is undefined for a city with no country or no places", () => {
    expect(countryOfCity([place("a", "x", undefined)], "x")).toBeUndefined();
    expect(countryOfCity(DATASET, "atlantis")).toBeUndefined();
  });
});

describe("topPlaces", () => {
  it("puts verified places first, most recently verified first, then the rest in order", () => {
    const places = [
      place("a", "x", "IN"),
      place("b", "x", "IN", { verified: { by: "v", on: "2026-01-01" } }),
      place("c", "x", "IN"),
      place("d", "x", "IN", { verified: { by: "v", on: "2026-06-01" } }),
    ];
    expect(topPlaces(places).map((p) => p.id)).toEqual(["d", "b", "a", "c"]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: 40 }, (_, i) => place(`p${i}`, "x", "IN"));
    expect(topPlaces(many)).toHaveLength(COUNTRY_TOP_PLACES);
    expect(topPlaces(many, 3)).toHaveLength(3);
  });

  it("does not reorder or mutate the input", () => {
    const places = [
      place("a", "x", "IN"),
      place("b", "x", "IN", { verified: { by: "v", on: "2026-01-01" } }),
    ];
    topPlaces(places);
    expect(places.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("countryMetaDescription", () => {
  it("is built from the real counts, with nothing for categories the country lacks", () => {
    const [india] = countryPages(DATASET);
    const description = countryMetaDescription(india);
    expect(description).toContain("India");
    expect(description).toContain("4 places (3 libraries and 1 airport)");
    expect(description).toContain("across 2 cities");
    expect(description).not.toContain("SAT");
  });

  it("reads in the singular for one place in one city", () => {
    const [kenya] = countryPages(DATASET).filter((p) => p.code === "KE");
    const description = countryMetaDescription(kenya);
    expect(description).toContain("1 SAT centre");
    expect(description).toContain("across 1 city,");
  });
});

describe("the real dataset", () => {
  const places = getPlaces();
  const pages = countryPages(places);

  it("has a page for every country the stats page counts, and no more", () => {
    const stats = computeStats(places, []);
    expect(pages).toHaveLength(stats.countryCount);
  });

  it("agrees with /stats on how many places each country has", () => {
    const stats = computeStats(places, []);
    for (const row of stats.places.country) {
      const page = pages.find((p) => p.code === row.key);
      expect(page, row.key).toBeDefined();
      expect(page?.places.length, row.key).toBe(row.count);
    }
  });

  it("covers every place that has a country, exactly once", () => {
    const withCountry = places.filter((p) => p.country);
    expect(pages.reduce((sum, p) => sum + p.places.length, 0)).toBe(withCountry.length);
  });

  it("gives each country's cities counts that add up to the country total", () => {
    for (const page of pages) {
      expect(
        page.cities.reduce((sum, c) => sum + c.count, 0),
        page.code,
      ).toBe(page.places.length);
    }
  });

  it("has unique, lowercase, two-letter slugs", () => {
    const slugs = pages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]{2}$/);
  });
});
