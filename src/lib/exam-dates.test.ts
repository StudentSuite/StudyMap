import { describe, expect, it } from "vitest";

import { EXAM_EVENTS, nextUpcomingEvent } from "@/lib/exam-dates";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Runs against the real clock, deliberately: this is the mechanism that
 * catches an event aging past its results/exam-end date with nobody
 * noticing (see #157). Once an event goes stale, a maintainer must either
 * update its dates or mark it `archived: true` to acknowledge it's done.
 */
describe("EXAM_EVENTS freshness", () => {
  const now = new Date();

  for (const event of EXAM_EVENTS) {
    it(`${event.id} is either upcoming or explicitly archived`, () => {
      const dates = [event.examEnd, event.results].filter((d) => ISO_DATE_RE.test(d));
      const isPast = dates.some((d) => new Date(`${d}T23:59:59`) < now);

      if (isPast && !event.archived) {
        throw new Error(
          `${event.id} ("${event.session}") has a results/exam-end date in the past. ` +
            `Update its dates for the next session, or set archived: true if it should ` +
            `stay as a historical record.`,
        );
      }
    });
  }
});

describe("nextUpcomingEvent", () => {
  it("skips events that have already ended", () => {
    const now = new Date("2026-09-05T00:00:00Z");
    const next = nextUpcomingEvent(now);
    expect(next).toBeDefined();
    expect(new Date(next!.examEnd + "T23:59:59").getTime()).toBeGreaterThanOrEqual(
      now.getTime(),
    );
  });
});
