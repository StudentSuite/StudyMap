import { describe, expect, it } from "vitest";

import {
  BOARD_LABELS,
  EXAM_EVENTS,
  eventsByBoard,
  nextUpcomingEvent,
} from "@/lib/exam-dates";
import type { ExamBoard } from "@/lib/exam-dates";

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

  it("returns undefined once every event has ended", () => {
    const farFuture = new Date("2999-01-01T00:00:00Z");
    expect(nextUpcomingEvent(farFuture)).toBeUndefined();
  });
});

describe("EXAM_EVENTS structural invariants", () => {
  it("has a unique, non-empty id for every event", () => {
    const ids = EXAM_EVENTS.map((e) => e.id);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has required fields populated for every event", () => {
    for (const event of EXAM_EVENTS) {
      expect(event.session.length).toBeGreaterThan(0);
      expect(event.examStart).toMatch(ISO_DATE_RE);
      expect(event.examEnd).toMatch(ISO_DATE_RE);
      expect(typeof event.results).toBe("string");
      expect(event.results.length).toBeGreaterThan(0);
      expect(typeof event.confirmed).toBe("boolean");
      expect(BOARD_LABELS).toHaveProperty(event.board);
      expect(event.source.label.length).toBeGreaterThan(0);
      expect(event.source.url).toMatch(/^https:\/\//);
    }
  });

  it("never has an exam end date before its exam start date", () => {
    for (const event of EXAM_EVENTS) {
      expect(event.examEnd >= event.examStart).toBe(true);
    }
  });

  it("orders eventsByBoard results by exam start date, ascending", () => {
    const boards: ExamBoard[] = ["SAT", "IB", "IGCSE"];
    for (const board of boards) {
      const events = eventsByBoard(board);
      expect(events.length).toBeGreaterThan(0);
      const starts = events.map((e) => e.examStart);
      expect(starts).toEqual([...starts].sort());
    }
  });

  it("eventsByBoard returns only events for the given board", () => {
    for (const event of eventsByBoard("SAT")) {
      expect(event.board).toBe("SAT");
    }
  });
});
