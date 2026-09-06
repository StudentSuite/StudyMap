import { describe, expect, it } from "vitest";

import type { CityPage } from "@/lib/city-pages";
import { ogCitySummary, ogCompetitionSummary, MAX_OG_COUNT_ROWS } from "@/lib/og";
import type { Competition } from "@/lib/types";

function page(
  places: Array<{ type: string; name: string }>,
  city = "navi_mumbai",
): CityPage {
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
    const types = [
      "library",
      "airport",
      "sat_centre",
      "gov_offices",
      "foreign_lang_exam_centre",
      "other_places",
    ];
    const summary = ogCitySummary(page(types.map((type) => ({ type, name: type }))));
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

function competition(overrides: Partial<Competition> = {}): Competition {
  return {
    id: "breakthrough-junior-challenge",
    name: "Breakthrough Junior Challenge",
    organizer: "Breakthrough Prize Foundation",
    organizer_url: "https://breakthroughjuniorchallenge.org",
    category: "stem",
    subjects: ["physics"],
    description: "A science communication video competition.",
    format: "online",
    age_min: 13,
    age_max: 18,
    participation: "individual",
    region: "international",
    fee: { amount: 0, currency: "USD" },
    prize: "USD 250,000 scholarship",
    official_url: "https://breakthroughjuniorchallenge.org",
    cycle_year: 2027,
    dates: [
      {
        label: "Submission deadline",
        date: "2027-06-25",
        type: "deadline",
        timezone: "UTC-4",
        estimated: false,
        source_url: "https://breakthroughjuniorchallenge.org/rules",
      },
      {
        label: "Results",
        date: "2027-11-01",
        type: "results",
        timezone: "UTC-4",
        estimated: true,
        source_url: "https://breakthroughjuniorchallenge.org/rules",
      },
    ],
    added_by: "test",
    ...overrides,
  };
}

describe("ogCompetitionSummary", () => {
  const NOW = new Date("2027-01-01T00:00:00Z");

  it("carries name, organizer and the human category label", () => {
    const summary = ogCompetitionSummary(competition(), NOW);
    expect(summary.name).toBe("Breakthrough Junior Challenge");
    expect(summary.organizer).toBe("Breakthrough Prize Foundation");
    expect(summary.category).toBe("STEM");
  });

  it("picks the soonest upcoming date", () => {
    const summary = ogCompetitionSummary(competition(), NOW);
    expect(summary.nextDate).toEqual({
      label: "Submission deadline",
      date: "2027-06-25",
    });
  });

  it("is null once every date has passed", () => {
    const summary = ogCompetitionSummary(competition(), new Date("2028-01-01T00:00:00Z"));
    expect(summary.nextDate).toBeNull();
  });
});
