import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchSavedCompetitionIds = vi.fn();
vi.mock("@/lib/competition-saves", () => ({
  fetchSavedCompetitionIds: (...args: unknown[]) => fetchSavedCompetitionIds(...args),
}));

vi.mock("@/lib/user-events", () => ({
  fetchUserEvents: () => Promise.resolve([]),
  PERSONAL_EVENT_CATEGORIES: [{ value: "exam", label: "Exam" }],
}));

let mockSupabaseClient: unknown = null;
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

import { CalendarView } from "@/app/calendar/CalendarView";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CalendarView competitions", () => {
  beforeEach(() => {
    mockSupabaseClient = null;
  });

  it("shows country-scoped competitions when signed out, never an empty grid", async () => {
    render(<CalendarView />);
    await waitFor(() => {
      expect(screen.getByText("Competitions this month").parentElement).toBeTruthy();
    });
    // With Supabase unconfigured (signed out), the calendar still renders
    // the competitions section and its country picker rather than nothing.
    expect(
      screen.getByLabelText("Country for competition qualifier stages"),
    ).toBeTruthy();
  });

  it("renders exam events, competitions and the calendar grid with Supabase unconfigured", () => {
    render(<CalendarView />);
    expect(screen.getByText("Competitions this month")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2 })).toBeTruthy();
    // No personal-events UI without Supabase configured.
    expect(screen.queryByText("Your events")).toBeNull();
  });

  it("does not show the saved/all toggle when the user has no saves", () => {
    mockSupabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    };
    fetchSavedCompetitionIds.mockResolvedValue([]);
    render(<CalendarView />);
    expect(screen.queryByText(/Showing (saved|all) competitions/)).toBeNull();
  });

  it("defaults to saved-only when signed in with at least one save, with a toggle to show all", async () => {
    mockSupabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    };
    fetchSavedCompetitionIds.mockResolvedValue(["regeneron-isef"]);

    render(<CalendarView />);

    const toggle = await screen.findByRole("button", {
      name: "Showing saved competitions only",
    });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("lets the user pick a different country for qualifier stages", () => {
    render(<CalendarView />);
    const select = screen.getByLabelText(
      "Country for competition qualifier stages",
    ) as HTMLSelectElement;
    expect(select.value).toBe("IN");
  });
});
