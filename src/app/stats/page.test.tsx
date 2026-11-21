import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import StatsPage from "@/app/stats/page";
import { getCompetitions } from "@/lib/competitions";
import { getPlaces } from "@/lib/places";
import { formatCount } from "@/lib/format";

afterEach(cleanup);

function press(group: string, name: string) {
  fireEvent.click(
    within(screen.getByRole("group", { name: group })).getByRole("button", { name }),
  );
}

describe("Stats page", () => {
  it("shows the dataset totals in the headline tiles", () => {
    render(<StatsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "StudyMap in numbers" }),
    ).toBeTruthy();
    expect(screen.getByText(formatCount(getPlaces().length))).toBeTruthy();
    expect(screen.getByText(formatCount(getCompetitions().length))).toBeTruthy();
    for (const label of [
      "Places",
      "Cities",
      "Countries",
      "Competitions",
      "Contributors",
      "Verified places",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("has no traffic numbers on it", () => {
    render(<StatsPage />);

    expect(screen.queryByText(/visitors/i)).toBeNull();
    expect(screen.queryByText(/page views/i)).toBeNull();
  });

  it("ranks places by category by default", () => {
    render(<StatsPage />);

    expect(screen.getByText("Places by category")).toBeTruthy();
    expect(
      within(screen.getByRole("group", { name: "Group by" }))
        .getByRole("button", { name: "Category" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("caps bars at ten and says so, with the full list in the table", () => {
    render(<StatsPage />);

    press("Group by", "City");
    expect(screen.getByText("Places by city")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText(/Showing the top 10 of/)).toBeTruthy();

    press("View", "Table");
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "City" })).toBeTruthy();
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(11);
  });

  it("switches to competitions with their own groupings", () => {
    render(<StatsPage />);

    press("Dataset", "Competitions");
    expect(screen.getByText("Competitions by category")).toBeTruthy();
    const group = screen.getByRole("group", { name: "Group by" });
    expect(within(group).queryByRole("button", { name: "City" })).toBeNull();

    press("Group by", "Region");
    expect(screen.getByText("Competitions by region")).toBeTruthy();
  });

  it("remembers each dataset's grouping when switching back", () => {
    render(<StatsPage />);

    press("Group by", "Country");
    press("Dataset", "Competitions");
    press("Dataset", "Places");
    expect(screen.getByText("Places by country")).toBeTruthy();
  });
});
