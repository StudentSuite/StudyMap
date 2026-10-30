import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CityStatsCard } from "@/components/home/city-stats-card";
import type { Place } from "@/lib/types";

afterEach(cleanup);

function place(overrides: Partial<Place> & Pick<Place, "id" | "type">): Place {
  return {
    name: overrides.id,
    city: "navi_mumbai",
    lat: 19.03,
    lng: 73.03,
    gmaps_link: "https://maps.google.com/?q=19.03,73.03",
    added_by: "test",
    ...overrides,
  };
}

const PLACES: Place[] = [
  place({ id: "navi-library-01", type: "library" }),
  place({ id: "navi-library-02", type: "library" }),
  place({ id: "navi-sat-01", type: "sat_centre" }),
  place({ id: "mumbai-airport-01", type: "airport", city: "mumbai" }),
];

describe("CityStatsCard", () => {
  it("titles the card with the city and counts only that city's places by type", () => {
    render(<CityStatsCard city="navi_mumbai" places={PLACES} />);

    expect(screen.getByText("Navi Mumbai")).toBeTruthy();
    const library = screen.getByRole("link", { name: /Library/ });
    expect(within(library).getByText("2")).toBeTruthy();
    const sat = screen.getByRole("link", { name: /SAT centre/ });
    expect(within(sat).getByText("1")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Airport/ })).toBeNull();
  });

  it("links each count to the map filtered to that city and type", () => {
    render(<CityStatsCard city="navi_mumbai" places={PLACES} />);

    const href = screen.getByRole("link", { name: /Library/ }).getAttribute("href") ?? "";
    expect(href.startsWith("/map?")).toBe(true);
    const params = new URLSearchParams(href.slice("/map?".length));
    expect(params.get("city")).toBe("navi_mumbai");
    expect(params.get("types")).toBe("library");
  });

  it("says so when the city has no places", () => {
    render(<CityStatsCard city="pune" places={PLACES} />);

    expect(screen.getByText("No places recorded yet.")).toBeTruthy();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
