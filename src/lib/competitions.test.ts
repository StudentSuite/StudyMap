import { describe, expect, it } from "vitest";

import {
  filterCompetitions,
  getCategories,
  getCompetitions,
  nextDate,
  upcomingDates,
} from "@/lib/competitions";
import type { Competition } from "@/lib/types";

function competition(overrides: Partial<Competition> & { id: string }): Competition {
  return {
    name: overrides.id,
    organizer: "Test Org",
    organizer_url: "https://example.com",
    category: "stem",
    subjects: ["science"],
    description: "A test competition.",
    format: "online",
    age_min: 13,
    age_max: 18,
    participation: "individual",
    region: "international",
    fee: { amount: 0, currency: "USD" },
    prize: "A prize",
    official_url: "https://example.com",
    cycle_year: 2026,
    dates: [],
    added_by: "test",
    ...overrides,
  };
}

const FIXTURE: Competition[] = [
  competition({
    id: "stem-free",
    category: "stem",
    format: "online",
    region: "international",
    participation: "individual",
    fee: { amount: 0, currency: "USD" },
    age_min: 13,
    age_max: 18,
    name: "Regeneron ISEF",
    organizer: "Society for Science",
    subjects: ["biology", "research"],
  }),
  competition({
    id: "math-paid",
    category: "mathematics",
    format: "in_person",
    region: "US",
    participation: "team",
    fee: { amount: 80, currency: "USD" },
    age_min: 13,
    age_max: 19,
    name: "HMMT",
    organizer: "Harvard-MIT Mathematics Tournament",
    subjects: ["mathematics"],
  }),
  competition({
    id: "coding-team",
    category: "coding",
    format: "online",
    region: "US",
    participation: "team",
    fee: { amount: 0, currency: "USD" },
    age_min: 10,
    age_max: 18,
    name: "picoCTF",
    organizer: "Carnegie Mellon University CyLab",
    subjects: ["cybersecurity"],
  }),
];

describe("filterCompetitions", () => {
  it("returns every competition when no filters are given", () => {
    expect(filterCompetitions(FIXTURE)).toHaveLength(FIXTURE.length);
  });

  it("filters by a single category", () => {
    const result = filterCompetitions(FIXTURE, { categories: ["mathematics"] });
    expect(result.map((c) => c.id)).toEqual(["math-paid"]);
  });

  it("filters by multiple categories", () => {
    const result = filterCompetitions(FIXTURE, { categories: ["mathematics", "coding"] });
    expect(result.map((c) => c.id)).toEqual(["math-paid", "coding-team"]);
  });

  it("filters by format", () => {
    const result = filterCompetitions(FIXTURE, { format: "in_person" });
    expect(result.map((c) => c.id)).toEqual(["math-paid"]);
  });

  it("filters by region", () => {
    const result = filterCompetitions(FIXTURE, { region: "US" });
    expect(result.map((c) => c.id)).toEqual(["math-paid", "coding-team"]);
  });

  it("filters by participation", () => {
    const result = filterCompetitions(FIXTURE, { participation: "team" });
    expect(result.map((c) => c.id)).toEqual(["math-paid", "coding-team"]);
  });

  it("filters by feeMax", () => {
    const result = filterCompetitions(FIXTURE, { feeMax: 0 });
    expect(result.map((c) => c.id)).toEqual(["stem-free", "coding-team"]);
  });

  it("filters by age within the eligible range", () => {
    const result = filterCompetitions(FIXTURE, { age: 11 });
    expect(result.map((c) => c.id)).toEqual(["coding-team"]);
  });

  it("matches a query against name, organizer and subjects, case-insensitively", () => {
    expect(filterCompetitions(FIXTURE, { query: "regeneron" }).map((c) => c.id)).toEqual([
      "stem-free",
    ]);
    expect(filterCompetitions(FIXTURE, { query: "CARNEGIE" }).map((c) => c.id)).toEqual([
      "coding-team",
    ]);
    expect(
      filterCompetitions(FIXTURE, { query: "cybersecurity" }).map((c) => c.id),
    ).toEqual(["coding-team"]);
  });

  it("composes two filters at once with AND semantics", () => {
    const result = filterCompetitions(FIXTURE, {
      region: "US",
      participation: "team",
      feeMax: 0,
    });
    expect(result.map((c) => c.id)).toEqual(["coding-team"]);
  });

  it("filters by deadlineBefore", () => {
    const withDeadline = [
      competition({
        id: "early-deadline",
        dates: [
          {
            label: "Deadline",
            date: "2026-01-01",
            type: "deadline",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com",
          },
        ],
      }),
      competition({
        id: "late-deadline",
        dates: [
          {
            label: "Deadline",
            date: "2026-12-01",
            type: "deadline",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com",
          },
        ],
      }),
    ];

    const result = filterCompetitions(withDeadline, { deadlineBefore: "2026-06-01" });
    expect(result.map((c) => c.id)).toEqual(["early-deadline"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterCompetitions(FIXTURE, { query: "does not exist" })).toEqual([]);
  });
});

describe("getCategories", () => {
  it("returns every category present in the real dataset, in enum order", () => {
    const categories = getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(new Set(categories).size).toBe(categories.length);
  });
});

describe("getCompetitions", () => {
  it("returns at least one record from every category file", () => {
    const competitions = getCompetitions();
    const categories = new Set(competitions.map((c) => c.category));
    expect(competitions.length).toBeGreaterThanOrEqual(50);
    expect(categories.size).toBeGreaterThanOrEqual(10);
  });
});

describe("upcomingDates", () => {
  const NOW = new Date("2026-06-01T00:00:00Z");

  const WITH_DATES = competition({
    id: "with-dates",
    dates: [
      {
        label: "Past deadline",
        date: "2026-01-01",
        type: "deadline",
        timezone: "UTC",
        estimated: false,
        source_url: "https://example.com/past",
      },
      {
        label: "Future round",
        date: "2026-08-01",
        type: "round",
        timezone: "UTC",
        estimated: false,
        source_url: "https://example.com/future",
      },
      {
        label: "Later results",
        date: "2026-09-01",
        type: "results",
        timezone: "UTC",
        estimated: true,
        source_url: "https://example.com/later",
      },
    ],
    country_tracks: [
      {
        country: "IN",
        official_url: "https://example.com/in",
        stages: [
          {
            name: "National round",
            date: "2026-07-01",
            estimated: true,
            source_url: "https://example.com/in-stage",
          },
        ],
      },
    ],
  });

  it("excludes past dates and sorts the rest ascending", () => {
    const result = upcomingDates(WITH_DATES, NOW);
    expect(result.map((d) => d.label)).toEqual(["Future round", "Later results"]);
  });

  it("omits country stages when no country is given", () => {
    const result = upcomingDates(WITH_DATES, NOW);
    expect(result.some((d) => d.country)).toBe(false);
  });

  it("includes only the requested country's stages, tagged with that country", () => {
    const result = upcomingDates(WITH_DATES, NOW, "IN");
    expect(result.map((d) => d.label)).toEqual([
      "National round",
      "Future round",
      "Later results",
    ]);
    expect(result.find((d) => d.label === "National round")?.country).toBe("IN");
  });

  it("returns an empty array once every date is in the past", () => {
    const result = upcomingDates(WITH_DATES, new Date("2027-01-01T00:00:00Z"));
    expect(result).toEqual([]);
  });
});

describe("nextDate", () => {
  const NOW = new Date("2026-06-01T00:00:00Z");

  it("skips past dates and returns the soonest future one", () => {
    const c = competition({
      id: "next-date-test",
      dates: [
        {
          label: "Past",
          date: "2026-01-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
        {
          label: "Soonest future",
          date: "2026-07-01",
          type: "round",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
        {
          label: "Later future",
          date: "2026-09-01",
          type: "results",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    expect(nextDate(c, NOW)?.label).toBe("Soonest future");
  });

  it("returns undefined when no dates remain", () => {
    const c = competition({
      id: "no-upcoming",
      dates: [
        {
          label: "Past",
          date: "2026-01-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    expect(nextDate(c, NOW)).toBeUndefined();
  });
});
