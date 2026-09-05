import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DeadlineCountdown,
  formatCompetitionDate,
  formatDuration,
} from "@/components/competitions/deadline-countdown";
import type { Competition } from "@/lib/types";

afterEach(cleanup);

function competition(overrides: Partial<Competition> = {}): Competition {
  return {
    id: "test-competition",
    name: "Test Competition",
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

describe("formatCompetitionDate", () => {
  it("formats an ISO date as a human date", () => {
    expect(formatCompetitionDate("2026-08-21")).toBe("August 21, 2026");
  });
});

describe("formatDuration", () => {
  it("formats under a day with hours, minutes and seconds", () => {
    expect(formatDuration(3 * 3600 * 1000 + 61 * 1000)).toBe("3h 1m 1s");
  });

  it("formats a multi-day duration with the day count", () => {
    expect(formatDuration(2 * 86_400 * 1000 + 3661 * 1000)).toBe("2d 1h 1m 1s");
  });

  it("shows months once the duration passes a year", () => {
    expect(formatDuration(400 * 86_400 * 1000)).toBe("13 months");
  });

  it("clamps a non-positive duration to zero rather than going negative", () => {
    expect(formatDuration(-5000)).toBe("0h 0m 0s");
  });
});

describe("DeadlineCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the static label and date, without a hydration/console warning", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const now = new Date("2026-06-01T00:00:00Z");
    vi.setSystemTime(now);
    const c = competition({
      dates: [
        {
          label: "Submission deadline",
          date: "2026-08-21",
          type: "deadline",
          timezone: "UTC-4",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    render(<DeadlineCountdown competition={c} now={now} />);

    expect(screen.getByText("Submission deadline")).toBeTruthy();
    expect(
      screen.getByText(
        (_, element) => element?.textContent === "August 21, 2026 (UTC-4)",
      ),
    ).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("ticks the countdown once per second after mount and clears its interval on unmount", () => {
    const now = new Date("2026-08-21T00:00:00-04:00");
    vi.setSystemTime(now);

    const c = competition({
      dates: [
        {
          label: "Submission deadline",
          date: "2026-08-21",
          type: "deadline",
          timezone: "UTC-4",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = render(<DeadlineCountdown competition={c} now={now} />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const first = screen.getByText(/h \d+m \d+s/).textContent;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const second = screen.getByText(/h \d+m \d+s/).textContent;
    expect(second).not.toBe(first);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("marks an estimated date as approximate", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    vi.setSystemTime(now);
    const c = competition({
      dates: [
        {
          label: "Regional round",
          date: "2026-09-01",
          type: "round",
          timezone: "UTC",
          estimated: true,
          source_url: "https://example.com",
        },
      ],
    });

    render(<DeadlineCountdown competition={c} now={now} />);
    expect(screen.getByText("approximate")).toBeTruthy();
  });

  it("shows the last known milestone with no countdown when no future date exists", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    vi.setSystemTime(now);
    const c = competition({
      dates: [
        {
          label: "Results announced",
          date: "2025-01-01",
          type: "results",
          timezone: "UTC",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    render(<DeadlineCountdown competition={c} now={now} />);
    expect(screen.getByText("Results announced")).toBeTruthy();
    expect(screen.queryByText(/\d+h \d+m \d+s/)).toBeNull();
  });

  it("renders without a negative countdown once the deadline passes while mounted", () => {
    const now = new Date("2026-08-20T23:00:00-04:00");
    vi.setSystemTime(now);

    const c = competition({
      dates: [
        {
          label: "Submission deadline",
          date: "2026-08-21",
          type: "deadline",
          timezone: "UTC-4",
          estimated: false,
          source_url: "https://example.com",
        },
      ],
    });

    render(<DeadlineCountdown competition={c} now={now} />);

    act(() => {
      // Past the 23:59:59 UTC-4 target instant.
      vi.setSystemTime(new Date("2026-08-22T05:00:00-04:00"));
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText(/-\d+h/)).toBeNull();
    expect(screen.queryByText(/^\d+h \d+m \d+s$/)).toBeNull();
  });
});
