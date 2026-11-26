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

  it("opens on Data and keeps the traffic numbers out of sight", () => {
    render(<StatsPage />);

    const toggle = within(screen.getByRole("group", { name: "Stats" }));
    expect(
      toggle.getByRole("button", { name: "Data" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      toggle.getByRole("button", { name: "Visitors" }).getAttribute("aria-pressed"),
    ).toBe("false");
    expect(screen.queryByText(/page views/i)).toBeNull();
    expect(screen.queryByText("1,743")).toBeNull();
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

describe("Stats page, Visitors view", () => {
  function openVisitors() {
    render(<StatsPage />);
    press("Stats", "Visitors");
  }

  it("swaps the dataset for the traffic numbers and back", () => {
    openVisitors();

    expect(screen.queryByText("Places by category")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "November 2026" })).toBeTruthy();

    press("Stats", "Data");
    expect(screen.getByText("Places by category")).toBeTruthy();
    expect(screen.queryByText(/page views/i)).toBeNull();
  });

  it("leads with November 2026 and its change against October", () => {
    openVisitors();

    // Stat tiles: visitors, page views, pages per visitor.
    expect(screen.getAllByText("1,743").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2,947").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1.69").length).toBeGreaterThan(0);
    expect(screen.getByText("+19.6% vs Oct 2026")).toBeTruthy();
    expect(screen.getByText("+19.2% vs Oct 2026")).toBeTruthy();
  });

  it("draws bars for both series by default", () => {
    openVisitors();

    const chart = screen.getByRole("group", {
      name: "Visitors and page views per month",
    });
    expect(
      within(chart).getByRole("img", {
        name: /October 2026: 1,457 visitors, 2,472 page views/,
      }),
    ).toBeTruthy();
    expect(
      within(chart).getByRole("img", {
        name: /November 2026: 1,743 visitors, 2,947 page views/,
      }),
    ).toBeTruthy();
    expect(chart.querySelectorAll("svg path[fill^='var(--viz-']")).toHaveLength(4);
  });

  it("offers every chart type and marks the active one", () => {
    openVisitors();

    const chartGroup = screen.getByRole("group", { name: "Chart" });
    for (const name of ["Bars", "Line", "Area", "Table"]) {
      expect(within(chartGroup).getByRole("button", { name })).toBeTruthy();
    }

    press("Chart", "Line");
    expect(
      within(chartGroup)
        .getByRole("button", { name: "Line" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(chartGroup)
        .getByRole("button", { name: "Bars" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
    // Two months are enough to draw a line, so no lone-point note.
    expect(screen.queryByText(/A line needs two months/)).toBeNull();
  });

  it("narrows to one series and keeps the table in step", () => {
    openVisitors();

    press("Show", "Visitors");
    expect(screen.getByRole("group", { name: "Visitors per month" })).toBeTruthy();

    press("Chart", "Table");
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Visitors" })).toBeTruthy();
    expect(within(table).queryByRole("columnheader", { name: "Page views" })).toBeNull();
    expect(within(table).getByRole("cell", { name: "1,457" })).toBeTruthy();
    expect(within(table).getByRole("cell", { name: "1,743" })).toBeTruthy();
  });

  it("table view lists every month, newest first, and hides the chart", () => {
    openVisitors();

    press("Chart", "Table");
    expect(screen.queryByRole("group", { name: /per month$/ })).toBeNull();
    const table = screen.getByRole("table");
    const months = within(table)
      .getAllByRole("rowheader")
      .map((cell) => cell.textContent);
    expect(months).toEqual(["November 2026", "October 2026"]);
    for (const value of ["1,457", "2,472", "1,743", "2,947", "1.70", "1.69"]) {
      expect(within(table).getByRole("cell", { name: value })).toBeTruthy();
    }
  });

  it("switches to running totals", () => {
    openVisitors();

    press("Values", "Running total");
    expect(
      screen.getByText("Oct 2026 to Nov 2026, running total", {
        selector: "[data-slot='card-description']",
      }),
    ).toBeTruthy();
    // 1,457 + 1,743 and 2,472 + 2,947.
    expect(
      screen.getByRole("img", {
        name: /November 2026, running total: 3,200 visitors, 5,419 page views/,
      }),
    ).toBeTruthy();
  });

  it("warns that a visitors running total counts returning visitors monthly", () => {
    openVisitors();

    expect(screen.queryByText(/counted once per month/)).toBeNull();
    press("Values", "Running total");
    expect(screen.getByText(/counted once per month/)).toBeTruthy();
    press("Show", "Page views");
    expect(screen.queryByText(/counted once per month/)).toBeNull();
  });

  it("shows a tooltip with every series on keyboard focus", () => {
    openVisitors();

    const month = screen.getByRole("img", { name: /November 2026: 1,743 visitors/ });
    fireEvent.focus(month);
    const chart = screen.getByRole("group", {
      name: "Visitors and page views per month",
    });
    expect(chart.textContent).toContain("Visitors");
    expect(chart.textContent).toContain("Page views");

    fireEvent.blur(month);
  });

  it("lists the higher series first in the tooltip, like the lines on the chart", () => {
    openVisitors();

    const month = screen.getByRole("img", { name: /November 2026: 1,743 visitors/ });
    fireEvent.focus(month);
    const chart = screen.getByRole("group", { name: "Visitors and page views per month" });
    const tooltip = chart.querySelector('[aria-hidden="true"].bg-popover');
    expect(tooltip).not.toBeNull();
    const text = tooltip!.textContent ?? "";
    // Page views are always at least visitors, so they come first and visitors sit below.
    expect(text.indexOf("Page views")).toBeGreaterThan(-1);
    expect(text.indexOf("Page views")).toBeLessThan(text.indexOf("Visitors"));

    fireEvent.blur(month);
  });
});
