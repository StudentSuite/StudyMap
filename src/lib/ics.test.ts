import { describe, expect, it } from "vitest";

import { competitionsIcs } from "@/lib/ics";
import { site } from "@/lib/site";
import type { Competition } from "@/lib/types";

const GENERATED_AT = new Date("2026-09-06T12:00:00.000Z");

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

/** Splits on the real CRLF the spec requires, not a bare \n. */
function lines(ics: string): string[] {
  return ics.split("\r\n").filter((l) => l.length > 0);
}

describe("competitionsIcs", () => {
  it("wraps every event in a well-formed VCALENDAR", () => {
    const ics = competitionsIcs([], GENERATED_AT);
    const ls = lines(ics);
    expect(ls[0]).toBe("BEGIN:VCALENDAR");
    expect(ls).toContain("VERSION:2.0");
    expect(ls.at(-1)).toBe("END:VCALENDAR");
  });

  it("uses CRLF line endings throughout, not bare \\n", () => {
    const ics = competitionsIcs([], GENERATED_AT);
    expect(ics).toContain("\r\n");
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("emits one VEVENT per dates[] entry", () => {
    const c = competition({
      id: "c1",
      name: "Test Competition",
      dates: [
        {
          label: "Registration opens",
          date: "2026-06-01",
          type: "registration_open",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
        {
          label: "Deadline",
          date: "2026-07-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    const ics = competitionsIcs([c], GENERATED_AT);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260601");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260701");
  });

  it("labels an estimated date as approximate in the title, and a confirmed one not", () => {
    const c = competition({
      id: "c1",
      name: "Test Competition",
      dates: [
        {
          label: "Results",
          date: "2026-08-01",
          type: "results",
          timezone: "UTC",
          estimated: true,
          source_url: "https://example.com",
        },
        {
          label: "Deadline",
          date: "2026-07-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    const ics = competitionsIcs([c], GENERATED_AT);
    expect(ics).toContain("SUMMARY:Test Competition: Results (approximate)");
    expect(ics).toContain("SUMMARY:Test Competition: Deadline");
    expect(ics).not.toContain("SUMMARY:Test Competition: Deadline (approximate)");
  });

  it("gives each event a stable UID keyed by competition id and date index", () => {
    const c = competition({
      id: "my-comp",
      dates: [
        {
          label: "A",
          date: "2026-06-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    const first = competitionsIcs([c], GENERATED_AT);
    const second = competitionsIcs([c], new Date("2027-01-01T00:00:00Z"));
    expect(first).toContain("UID:my-comp-date-0@studyymap.com");
    // Regenerating later (different DTSTAMP) must not change the UID -
    // that's what lets a calendar client recognize "same event" on refetch.
    expect(second).toContain("UID:my-comp-date-0@studyymap.com");
  });

  it("links each event back to the competition's own StudyMap page", () => {
    const c = competition({
      id: "my-comp",
      dates: [
        {
          label: "A",
          date: "2026-06-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });
    expect(competitionsIcs([c], GENERATED_AT)).toContain(
      `URL:${site.url}/competitions/my-comp`,
    );
  });

  it("escapes commas, semicolons and backslashes in free text", () => {
    const c = competition({
      id: "c1",
      name: "Odd, Name; With\\Backslash",
      description: "Line one\nLine two",
      dates: [
        {
          label: "Deadline",
          date: "2026-06-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    const ics = competitionsIcs([c], GENERATED_AT);
    expect(ics).toContain("Odd\\, Name\\; With\\\\Backslash");
    expect(ics).toContain("Line one\\nLine two");
  });

  it("folds a content line longer than 75 octets", () => {
    const c = competition({
      id: "c1",
      name: "A".repeat(120),
      dates: [
        {
          label: "Deadline",
          date: "2026-06-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    const ics = competitionsIcs([c], GENERATED_AT);
    // The folded SUMMARY line continues on the next physical line with a
    // single leading space, per RFC 5545 line-folding.
    expect(ics).toMatch(/SUMMARY:A{50,}\r\n {1}A+/);
    // No single physical line (content between CRLFs) should exceed 75
    // octets once folded, except by exactly the leading space we added.
    for (const raw of ics.split("\r\n")) {
      expect(raw.length).toBeLessThanOrEqual(76);
    }
  });

  it("returns just the calendar shell when there are no saved competitions", () => {
    const ics = competitionsIcs([], GENERATED_AT);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("handles multiple competitions each contributing their own events", () => {
    const a = competition({
      id: "a",
      dates: [
        {
          label: "Deadline",
          date: "2026-06-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });
    const b = competition({
      id: "b",
      dates: [
        {
          label: "Deadline",
          date: "2026-07-01",
          type: "deadline",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    const ics = competitionsIcs([a, b], GENERATED_AT);
    expect(ics).toContain("UID:a-date-0@studyymap.com");
    expect(ics).toContain("UID:b-date-0@studyymap.com");
  });
});
