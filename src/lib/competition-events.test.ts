import { describe, expect, it } from "vitest";

import {
  competitionEvents,
  competitionEventsInMonth,
  competitionsForCountry,
} from "@/lib/competition-events";
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

describe("competitionEvents", () => {
  it("flattens every competition's own dates[]", () => {
    const competitions = [
      competition({
        id: "c1",
        dates: [
          {
            label: "Deadline",
            date: "2026-06-01",
            type: "deadline",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com/d",
          },
        ],
      }),
    ];

    const events = competitionEvents(competitions);
    expect(events).toEqual([
      {
        id: "c1-date-0",
        competitionId: "c1",
        competitionName: "c1",
        label: "Deadline",
        date: "2026-06-01",
        estimated: false,
        sourceUrl: "https://example.com/d",
        country: undefined,
      },
    ]);
  });

  it("omits country_tracks stages when no country is given", () => {
    const competitions = [
      competition({
        id: "c1",
        country_tracks: [
          {
            country: "IN",
            official_url: "https://example.com/in",
            stages: [
              {
                name: "ZIO",
                date: "2026-11-01",
                estimated: true,
                source_url: "https://example.com/zio",
              },
            ],
          },
        ],
      }),
    ];

    expect(competitionEvents(competitions)).toEqual([]);
  });

  it("includes only the requested country's stages, tagged with that country", () => {
    const competitions = [
      competition({
        id: "c1",
        country_tracks: [
          {
            country: "IN",
            official_url: "https://example.com/in",
            stages: [
              {
                name: "ZIO",
                date: "2026-11-01",
                estimated: true,
                source_url: "https://example.com/zio",
              },
            ],
          },
          {
            country: "US",
            official_url: "https://example.com/us",
            stages: [
              {
                name: "USACO",
                date: "2026-12-01",
                estimated: true,
                source_url: "https://example.com/usaco",
              },
            ],
          },
        ],
      }),
    ];

    const events = competitionEvents(competitions, "IN");
    expect(events.map((e) => e.label)).toEqual(["ZIO"]);
    expect(events[0].country).toBe("IN");
    // The estimated flag on a stage survives flattening too, not just on
    // a competition's own dates[] entries.
    expect(events[0].estimated).toBe(true);
  });

  it("a competition with no country_tracks at all produces only its own dates, even when a country is requested", () => {
    const competitions = [
      competition({
        id: "c1",
        dates: [
          {
            label: "Deadline",
            date: "2026-06-01",
            type: "deadline",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com/d",
          },
        ],
        // country_tracks intentionally omitted (undefined), not an empty array.
      }),
    ];

    const events = competitionEvents(competitions, "IN");
    expect(events.map((e) => e.label)).toEqual(["Deadline"]);
    expect(events.every((e) => e.country === undefined)).toBe(true);
  });

  it("the estimated flag survives flattening for a competition's own dates[] too", () => {
    const competitions = [
      competition({
        id: "c1",
        dates: [
          {
            label: "Confirmed",
            date: "2026-06-01",
            type: "deadline",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com",
          },
          {
            label: "Provisional",
            date: "2026-07-01",
            type: "results",
            timezone: "UTC",
            estimated: true,
            source_url: "https://example.com",
          },
        ],
      }),
    ];

    const events = competitionEvents(competitions);
    expect(events.find((e) => e.label === "Confirmed")?.estimated).toBe(false);
    expect(events.find((e) => e.label === "Provisional")?.estimated).toBe(true);
  });
});

describe("competitionEventsInMonth", () => {
  it("keeps only events in the given month", () => {
    const events = competitionEvents([
      competition({
        id: "c1",
        dates: [
          {
            label: "June",
            date: "2026-06-15",
            type: "deadline",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com",
          },
          {
            label: "July",
            date: "2026-07-15",
            type: "deadline",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com",
          },
        ],
      }),
    ]);

    const result = competitionEventsInMonth(events, 2026, 5); // June, 0-indexed
    expect(result.map((e) => e.label)).toEqual(["June"]);
  });

  it("keeps a month-boundary date in its own month regardless of the runner's local timezone", () => {
    // event.date is parsed as `${date}T00:00:00` (local time, no `Z`), not
    // a bare "YYYY-MM-DD" (which Date parses as UTC midnight and can read
    // back as the previous day in any timezone behind UTC). Prove that by
    // running the same assertion under a timezone on each side of UTC.
    const events = competitionEvents([
      competition({
        id: "c1",
        dates: [
          {
            label: "First of the month",
            date: "2026-06-01",
            type: "deadline",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com",
          },
        ],
      }),
    ]);

    const originalTz = process.env.TZ;
    for (const tz of ["Pacific/Kiritimati", "Etc/GMT+12"]) {
      process.env.TZ = tz;
      try {
        const result = competitionEventsInMonth(events, 2026, 5); // June
        expect(result.map((e) => e.label)).toEqual(["First of the month"]);
      } finally {
        process.env.TZ = originalTz;
      }
    }
  });
});

describe("competitionsForCountry", () => {
  const international = competition({ id: "intl", region: "international" });
  const usOnly = competition({ id: "us-only", region: "US" });
  const gbOnly = competition({ id: "gb-only", region: "GB" });
  const withInTrack = competition({
    id: "with-in-track",
    region: "US",
    country_tracks: [
      {
        country: "IN",
        official_url: "https://example.com",
        stages: [
          {
            name: "Stage",
            date: "2026-01-01",
            estimated: true,
            source_url: "https://example.com",
          },
        ],
      },
    ],
  });

  it("includes international competitions for any country", () => {
    expect(competitionsForCountry([international], "IN").map((c) => c.id)).toEqual([
      "intl",
    ]);
  });

  it("includes competitions whose region matches the country", () => {
    expect(competitionsForCountry([usOnly], "US").map((c) => c.id)).toEqual(["us-only"]);
  });

  it("excludes competitions region-locked to a different country", () => {
    expect(competitionsForCountry([gbOnly], "IN")).toEqual([]);
  });

  it("includes a competition with a country_track for that country even if its region differs", () => {
    expect(competitionsForCountry([withInTrack], "IN").map((c) => c.id)).toEqual([
      "with-in-track",
    ]);
  });
});
