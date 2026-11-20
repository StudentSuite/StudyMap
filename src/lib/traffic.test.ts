import { describe, expect, it } from "vitest";

import {
  formatCount,
  formatMonth,
  pagesPerVisitor,
  percentChange,
  toRunningTotal,
  trafficMonths,
  type TrafficMonth,
} from "@/lib/traffic";

describe("trafficMonths", () => {
  it("starts in October 2026 with the recorded numbers", () => {
    expect(trafficMonths[0]).toEqual({
      month: "2026-10",
      visitors: 1133,
      pageViews: 2931,
    });
  });

  it("is sorted oldest first with no duplicate months", () => {
    const keys = trafficMonths.map((row) => row.month);
    expect(keys).toEqual([...keys].sort());
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("formatMonth", () => {
  it("formats long, medium and short labels", () => {
    expect(formatMonth("2026-10", "long")).toBe("October 2026");
    expect(formatMonth("2026-10", "medium")).toBe("Oct 2026");
    expect(formatMonth("2026-10", "short")).toBe("Oct 26");
  });

  it("does not drift across the year boundary", () => {
    expect(formatMonth("2027-01", "long")).toBe("January 2027");
    expect(formatMonth("2026-12", "short")).toBe("Dec 26");
  });

  it("returns a malformed key unchanged", () => {
    expect(formatMonth("2026-13", "long")).toBe("2026-13");
    expect(formatMonth("oct", "short")).toBe("oct");
  });
});

describe("pagesPerVisitor", () => {
  it("divides page views by visitors", () => {
    expect(
      pagesPerVisitor({ month: "2026-10", visitors: 1133, pageViews: 2931 }),
    ).toBeCloseTo(2.587, 3);
  });

  it("is null when there were no visitors", () => {
    expect(pagesPerVisitor({ month: "2026-10", visitors: 0, pageViews: 0 })).toBeNull();
  });
});

describe("toRunningTotal", () => {
  it("accumulates each metric and leaves the input alone", () => {
    const rows: TrafficMonth[] = [
      { month: "2026-10", visitors: 10, pageViews: 30 },
      { month: "2026-11", visitors: 5, pageViews: 20 },
      { month: "2026-12", visitors: 1, pageViews: 2 },
    ];
    expect(toRunningTotal(rows)).toEqual([
      { month: "2026-10", visitors: 10, pageViews: 30 },
      { month: "2026-11", visitors: 15, pageViews: 50 },
      { month: "2026-12", visitors: 16, pageViews: 52 },
    ]);
    expect(rows[1]).toEqual({ month: "2026-11", visitors: 5, pageViews: 20 });
  });
});

describe("percentChange", () => {
  it("computes growth and decline", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(75, 100)).toBe(-25);
  });

  it("is null with no baseline", () => {
    expect(percentChange(100, undefined)).toBeNull();
    expect(percentChange(100, 0)).toBeNull();
  });
});

describe("formatCount", () => {
  it("adds thousands separators", () => {
    expect(formatCount(1133)).toBe("1,133");
    expect(formatCount(2931)).toBe("2,931");
  });
});
