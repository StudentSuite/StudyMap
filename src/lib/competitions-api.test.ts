import { describe, expect, it } from "vitest";

import {
  COMPETITIONS_API_LIMITS,
  parseCompetitionsQuery,
  queryCompetitions,
} from "@/lib/competitions-api";
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

const DATASET: Competition[] = [
  competition({
    id: "stem-free",
    category: "stem",
    format: "online",
    region: "international",
    participation: "individual",
    fee: { amount: 0, currency: "USD" },
    age_min: 13,
    age_max: 18,
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
  }),
  competition({
    id: "coding-in-track",
    category: "coding",
    format: "online",
    region: "US",
    participation: "team",
    fee: { amount: 0, currency: "USD" },
    age_min: 10,
    age_max: 18,
    country_tracks: [
      {
        country: "IN",
        official_url: "https://example.com/in",
        stages: [
          {
            name: "National round",
            date: "2026-07-01",
            estimated: true,
            source_url: "https://example.com",
          },
        ],
      },
    ],
  }),
];

function params(entries: [string, string][]): URLSearchParams {
  return new URLSearchParams(entries);
}

describe("parseCompetitionsQuery defaults", () => {
  it("applies the default limit and zero offset with every filter undefined", () => {
    const parsed = parseCompetitionsQuery(params([]));
    expect(parsed).toEqual({
      ok: true,
      query: {
        category: undefined,
        format: undefined,
        participation: undefined,
        region: undefined,
        country: undefined,
        freeOnly: undefined,
        age: undefined,
        deadlineBefore: undefined,
        limit: COMPETITIONS_API_LIMITS.defaultLimit,
        offset: 0,
      },
    });
  });

  it("clamps a limit above the hard maximum instead of dumping everything", () => {
    const parsed = parseCompetitionsQuery(params([["limit", "999999"]]));
    expect(parsed.ok && parsed.query.limit).toBe(COMPETITIONS_API_LIMITS.maxLimit);
  });
});

describe("parseCompetitionsQuery validation", () => {
  it("rejects an unknown category with the accepted enum listed", () => {
    const parsed = parseCompetitionsQuery(params([["category", "knitting"]]));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("mathematics");
  });

  it("rejects an unknown format", () => {
    expect(parseCompetitionsQuery(params([["format", "telepathic"]])).ok).toBe(false);
  });

  it("accepts every real format value", () => {
    for (const format of ["online", "in_person", "hybrid"]) {
      expect(parseCompetitionsQuery(params([["format", format]])).ok).toBe(true);
    }
  });

  it("rejects an unknown participation type", () => {
    expect(parseCompetitionsQuery(params([["participation", "solo-ish"]])).ok).toBe(
      false,
    );
  });

  it("rejects an empty region", () => {
    expect(parseCompetitionsQuery(params([["region", "  "]])).ok).toBe(false);
  });

  it("passes region through unmodified rather than validating against a fixed list", () => {
    const parsed = parseCompetitionsQuery(params([["region", "US"]]));
    expect(parsed.ok && parsed.query.region).toBe("US");
  });

  it("accepts a real country, unlike the places API which rejects country outright", () => {
    const parsed = parseCompetitionsQuery(params([["country", "IN"]]));
    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.query.country).toBe("IN");
  });

  it("rejects an unknown country", () => {
    const parsed = parseCompetitionsQuery(params([["country", "ZZ"]]));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("ZZ");
  });

  it('accepts fee=free and rejects any other fee value', () => {
    const parsed = parseCompetitionsQuery(params([["fee", "free"]]));
    expect(parsed.ok && parsed.query.freeOnly).toBe(true);
    expect(parseCompetitionsQuery(params([["fee", "cheap"]])).ok).toBe(false);
  });

  it("rejects a malformed age", () => {
    expect(parseCompetitionsQuery(params([["age", "teen"]])).ok).toBe(false);
    expect(parseCompetitionsQuery(params([["age", "-1"]])).ok).toBe(false);
  });

  it("accepts age zero, unlike limit which must be positive", () => {
    const parsed = parseCompetitionsQuery(params([["age", "0"]]));
    expect(parsed.ok && parsed.query.age).toBe(0);
  });

  it("rejects a malformed deadline_before", () => {
    expect(
      parseCompetitionsQuery(params([["deadline_before", "not-a-date"]])).ok,
    ).toBe(false);
  });

  it("accepts a well-formed deadline_before", () => {
    const parsed = parseCompetitionsQuery(params([["deadline_before", "2026-06-01"]]));
    expect(parsed.ok && parsed.query.deadlineBefore).toBe("2026-06-01");
  });

  it("rejects malformed limit and offset values", () => {
    expect(parseCompetitionsQuery(params([["limit", "abc"]])).ok).toBe(false);
    expect(parseCompetitionsQuery(params([["limit", "0"]])).ok).toBe(false);
    expect(parseCompetitionsQuery(params([["limit", "-5"]])).ok).toBe(false);
    expect(parseCompetitionsQuery(params([["offset", "1.5"]])).ok).toBe(false);
    expect(parseCompetitionsQuery(params([["offset", "-1"]])).ok).toBe(false);
  });

  it("rejects every repeated parameter, not just some of them", () => {
    const repeatable = [
      "category",
      "format",
      "participation",
      "region",
      "country",
      "fee",
      "age",
      "deadline_before",
      "limit",
      "offset",
    ];
    const values: Record<string, string> = {
      category: "stem",
      format: "online",
      participation: "team",
      region: "US",
      country: "IN",
      fee: "free",
      age: "15",
      deadline_before: "2026-06-01",
      limit: "10",
      offset: "0",
    };
    for (const name of repeatable) {
      const parsed = parseCompetitionsQuery(
        params([
          [name, values[name]],
          [name, values[name]],
        ]),
      );
      expect(parsed.ok, `expected ${name} to reject when repeated`).toBe(false);
    }
  });
});

describe("queryCompetitions", () => {
  const BASE_QUERY = {
    category: undefined,
    format: undefined,
    participation: undefined,
    region: undefined,
    country: undefined,
    freeOnly: undefined,
    age: undefined,
    deadlineBefore: undefined,
    limit: 100,
    offset: 0,
  };

  it("returns everything unpaginated when no filters apply", () => {
    const result = queryCompetitions(DATASET, BASE_QUERY);
    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(3);
  });

  it("filters by category", () => {
    const result = queryCompetitions(DATASET, { ...BASE_QUERY, category: "mathematics" });
    expect(result.data.map((c) => c.id)).toEqual(["math-paid"]);
  });

  it("filters by country against country_tracks, not region", () => {
    const result = queryCompetitions(DATASET, { ...BASE_QUERY, country: "IN" });
    expect(result.data.map((c) => c.id)).toEqual(["coding-in-track"]);
  });

  it("returns nothing for a country no record tracks", () => {
    const result = queryCompetitions(DATASET, { ...BASE_QUERY, country: "GB" });
    expect(result.data).toEqual([]);
  });

  it("composes country with another filter", () => {
    const result = queryCompetitions(DATASET, {
      ...BASE_QUERY,
      country: "IN",
      format: "online",
    });
    expect(result.data.map((c) => c.id)).toEqual(["coding-in-track"]);
  });

  it("filters free-only via freeOnly", () => {
    const result = queryCompetitions(DATASET, { ...BASE_QUERY, freeOnly: true });
    expect(result.data.map((c) => c.id).sort()).toEqual(["coding-in-track", "stem-free"]);
  });

  it("applies limit and offset with total reflecting the full match set", () => {
    const page = queryCompetitions(DATASET, { ...BASE_QUERY, limit: 1, offset: 1 });
    expect(page.data).toHaveLength(1);
    expect(page.total).toBe(3);
  });

  it("returns an empty page past the end without erroring", () => {
    const result = queryCompetitions(DATASET, { ...BASE_QUERY, offset: 100 });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(3);
  });

  it("returns an empty dataset unchanged", () => {
    const result = queryCompetitions([], BASE_QUERY);
    expect(result).toEqual({ data: [], total: 0, limit: 100, offset: 0 });
  });
});
