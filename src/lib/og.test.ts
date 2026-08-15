import { describe, expect, it } from "vitest";

import type { CityPage } from "@/lib/city-pages";
import { ogCitySummary, MAX_OG_COUNT_ROWS } from "@/lib/og";

function page(places: Array<{ type: string; name: string }>, city = "navi_mumbai"): CityPage {
  return {
    slug: city,
    city,
    places: places.map((p, i) => ({
      id: `p${i}`,
      name: p.name,
      type: p.type as CityPage["places"][number]["type"],
      city,
    })) as CityPage["places"],
  };
}

describe("ogCitySummary", () => {
  it("names the city and counts every place", () => {
    const summary = ogCitySummary(
      page([
        { type: "library", name: "A" },
        { type: "library", name: "B" },
        { type: "airport", name: "C" },
      ]),
    );
    expect(summary.name).toBe("Navi Mumbai");
    expect(summary.total).toBe(3);
  });

  it("orders categories by size, ties in canonical order", () => {
    const summary = ogCitySummary(
      page([
        { type: "airport", name: "A" },
        { type: "library", name: "B" },
        { type: "library", name: "C" },
        { type: "gov_offices", name: "D" },
        { type: "sat_centre", name: "E" },
        { type: "sat_centre", name: "F" },
      ]),
    );
    expect(summary.counts).toEqual([
      { label: "Library", count: 2 },
      { label: "SAT centre", count: 2 },
      { label: "Airport", count: 1 },
      { label: "Government offices", count: 1 },
    ]);
    expect(summary.more).toBe(0);
  });

  it("caps the card and reports the remainder as more", () => {
    const types = ["library", "airport", "sat_centre", "gov_offices", "foreign_lang_exam_centre", "other_places"];
    const summary = ogCitySummary(
      page(types.map((type) => ({ type, name: type }))),
    );
    expect(summary.counts).toHaveLength(MAX_OG_COUNT_ROWS);
    expect(summary.more).toBe(types.length - MAX_OG_COUNT_ROWS);
  });

  it("stays empty for a city with no places", () => {
    const summary = ogCitySummary(page([]));
    expect(summary.total).toBe(0);
    expect(summary.counts).toEqual([]);
    expect(summary.more).toBe(0);
  });
});
