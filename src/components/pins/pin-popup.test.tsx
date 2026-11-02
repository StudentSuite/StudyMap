import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PinPopup } from "@/components/pins/pin-popup";
import type { Place } from "@/lib/types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(cleanup);

const place: Place = {
  id: "mum-library-07",
  name: "City Library",
  type: "library",
  city: "mumbai",
  lat: 19.0176,
  lng: 72.8562,
  gmaps_link: "https://maps.google.com/?q=19.0176,72.8562",
  added_by: "someone",
};

describe("PinPopup directions", () => {
  it("opens the maps-app picker from the directions button", () => {
    render(<PinPopup place={place} />);
    expect(screen.queryByText("Get directions")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Directions to City Library" }));

    expect(screen.getByText("Get directions")).toBeTruthy();
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
    expect(links.some((href) => href.startsWith("https://maps.apple.com/"))).toBe(true);
    expect(links.some((href) => href.startsWith("geo:19.0176,72.8562"))).toBe(true);
  });

  it("keeps the direct Google Maps link in the popup", () => {
    render(<PinPopup place={place} />);

    const google = screen.getByRole("link", { name: /Google Maps/ });
    expect(google.getAttribute("href")).toBe(place.gmaps_link);
  });
});

describe("PinPopup report a problem", () => {
  it("opens the report dialog for this place", () => {
    render(<PinPopup place={place} />);
    expect(screen.queryByText("Report an issue")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Report a problem" }));

    expect(screen.getByText("Report an issue")).toBeTruthy();
    expect(
      screen.getByText(/City Library - opens a pre-filled GitHub issue/),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open GitHub issue" })).toBeTruthy();
  });
});
