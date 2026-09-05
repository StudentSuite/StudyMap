import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchCalendarToken = vi.fn();
const rotateCalendarToken = vi.fn();
vi.mock("@/lib/user-profile", () => ({
  fetchCalendarToken: (...args: unknown[]) => fetchCalendarToken(...args),
  rotateCalendarToken: (...args: unknown[]) => rotateCalendarToken(...args),
}));

import { CalendarFeedCard } from "@/components/competitions/calendar-feed-card";
import { site } from "@/lib/site";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CalendarFeedCard", () => {
  it("shows the feed URL built from the fetched token", async () => {
    fetchCalendarToken.mockResolvedValue("abc-123");
    render(<CalendarFeedCard />);

    const input = await screen.findByLabelText("Calendar feed URL");
    expect((input as HTMLInputElement).value).toBe(
      `${site.url}/api/competitions/saved.ics?token=abc-123`,
    );
  });

  it("shows an error instead of a broken link when the token can't be loaded", async () => {
    fetchCalendarToken.mockRejectedValue(new Error("boom"));
    render(<CalendarFeedCard />);

    expect(
      await screen.findByText("Couldn't load your calendar feed link. Try reloading."),
    ).toBeTruthy();
  });

  it("requires a confirm step before rotating, and updates the URL after", async () => {
    fetchCalendarToken.mockResolvedValue("old-token");
    rotateCalendarToken.mockResolvedValue("new-token");
    render(<CalendarFeedCard />);

    await screen.findByLabelText("Calendar feed URL");

    fireEvent.click(screen.getByRole("button", { name: /Get a new link/ }));
    expect(rotateCalendarToken).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Rotate link" }));
    await waitFor(() => expect(rotateCalendarToken).toHaveBeenCalledTimes(1));

    const input = await screen.findByLabelText("Calendar feed URL");
    await waitFor(() =>
      expect((input as HTMLInputElement).value).toBe(
        `${site.url}/api/competitions/saved.ics?token=new-token`,
      ),
    );
  });

  it("cancelling the rotate confirmation leaves the old token in place", async () => {
    fetchCalendarToken.mockResolvedValue("old-token");
    render(<CalendarFeedCard />);
    await screen.findByLabelText("Calendar feed URL");

    fireEvent.click(screen.getByRole("button", { name: /Get a new link/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(rotateCalendarToken).not.toHaveBeenCalled();
    const input = await screen.findByLabelText("Calendar feed URL");
    expect((input as HTMLInputElement).value).toContain("old-token");
  });
});
