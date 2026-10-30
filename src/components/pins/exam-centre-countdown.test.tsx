import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExamCentreCountdown } from "@/components/pins/exam-centre-countdown";
import { PinPopup } from "@/components/pins/pin-popup";
import type { Place } from "@/lib/types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(cleanup);

const centre: Place = {
  id: "12345",
  name: "Example International School",
  type: "sat_centre",
  city: "mumbai",
  lat: 19.0176,
  lng: 72.8562,
  gmaps_link: "https://maps.google.com/?q=19.0176,72.8562",
  added_by: "someone",
  exam: "SAT",
  valid_till: "2027-03-15",
};

const now = new Date("2026-10-21T12:00:00");

describe("ExamCentreCountdown", () => {
  it("shows a calm pill while the date is far away", () => {
    render(<ExamCentreCountdown place={centre} now={now} />);

    const pill = screen.getByText(/^Valid until/);
    expect(pill.textContent).toContain("2027");
    expect(pill.className).toContain("text-success");
  });

  it("switches to a warning inside the 60 day window", () => {
    render(
      <ExamCentreCountdown place={{ ...centre, valid_till: "2026-11-20" }} now={now} />,
    );

    const pill = screen.getByText(/^Expires soon/);
    expect(pill.className).toContain("text-warning");
  });

  it("still counts as valid on the last day", () => {
    render(
      <ExamCentreCountdown place={{ ...centre, valid_till: "2026-10-22" }} now={now} />,
    );

    expect(screen.getByText(/^Expires soon/)).toBeTruthy();
  });

  it("shows Expired in the destructive colour once the date has passed", () => {
    render(
      <ExamCentreCountdown place={{ ...centre, valid_till: "2026-09-01" }} now={now} />,
    );

    const pill = screen.getByText(/^Expired/);
    expect(pill.className).toContain("text-destructive");
  });

  it("renders nothing when the place has no valid_till", () => {
    const { valid_till, ...withoutDate } = centre;
    void valid_till;
    const { container } = render(<ExamCentreCountdown place={withoutDate} now={now} />);

    expect(container.innerHTML).toBe("");
  });
});

describe("PinPopup exam centre validity", () => {
  it("shows the validity pill and no duplicate reconfirm text for an exam centre", () => {
    render(<PinPopup place={centre} />);

    expect(screen.getByText(/^(Valid until|Expires soon|Expired)/)).toBeTruthy();
    expect(screen.getByText("SAT")).toBeTruthy();
    expect(screen.queryByText(/reconfirm by/)).toBeNull();
  });

  it("shows no pill for a place that is not an exam centre", () => {
    const library: Place = { ...centre, type: "library" };
    delete library.exam;
    delete library.valid_till;
    render(<PinPopup place={library} />);

    expect(screen.queryByText(/^(Valid until|Expires soon|Expired)/)).toBeNull();
  });
});
