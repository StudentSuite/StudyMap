import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import TrafficPage from "@/app/traffic/page";

afterEach(cleanup);

function press(group: string, name: string) {
  fireEvent.click(
    within(screen.getByRole("group", { name: group })).getByRole("button", { name }),
  );
}

describe("Traffic page", () => {
  it("leads with the October 2026 numbers", () => {
    render(<TrafficPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Monthly traffic" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "October 2026" })).toBeTruthy();
    // Stat tiles: visitors, page views, pages per visitor.
    expect(screen.getAllByText("1,133").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2,931").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2.59").length).toBeGreaterThan(0);
  });

  it("draws bars for both series by default", () => {
    render(<TrafficPage />);

    const chart = screen.getByRole("group", {
      name: "Visitors and page views per month",
    });
    expect(
      within(chart).getByRole("img", {
        name: /October 2026: 1,133 visitors, 2,931 page views/,
      }),
    ).toBeTruthy();
    expect(chart.querySelectorAll("svg path[fill^='var(--viz-']")).toHaveLength(2);
  });

  it("offers every chart type and marks the active one", () => {
    render(<TrafficPage />);

    const chartGroup = screen.getByRole("group", { name: "Chart" });
    for (const name of ["Bars", "Line", "Area", "Table"]) {
      expect(within(chartGroup).getByRole("button", { name })).toBeTruthy();
    }
    expect(
      within(chartGroup)
        .getByRole("button", { name: "Bars" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

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
  });

  it("explains a lone point on line and area charts", () => {
    render(<TrafficPage />);

    expect(screen.queryByText(/A line needs two months/)).toBeNull();
    press("Chart", "Line");
    expect(screen.getByText(/A line needs two months/)).toBeTruthy();
    press("Chart", "Area");
    expect(screen.getByText(/A line needs two months/)).toBeTruthy();
  });

  it("narrows to one series and keeps the table in step", () => {
    render(<TrafficPage />);

    press("Show", "Visitors");
    expect(screen.getByRole("group", { name: "Visitors per month" })).toBeTruthy();

    press("Chart", "Table");
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Visitors" })).toBeTruthy();
    expect(within(table).queryByRole("columnheader", { name: "Page views" })).toBeNull();
    expect(
      within(table).queryByRole("columnheader", { name: "Pages per visitor" }),
    ).toBeNull();
    expect(within(table).getByRole("cell", { name: "1,133" })).toBeTruthy();
  });

  it("table view lists every value, and hides the chart", () => {
    render(<TrafficPage />);

    press("Chart", "Table");
    expect(screen.queryByRole("group", { name: /per month$/ })).toBeNull();
    const table = screen.getByRole("table");
    expect(within(table).getByRole("rowheader", { name: "October 2026" })).toBeTruthy();
    expect(within(table).getByRole("cell", { name: "1,133" })).toBeTruthy();
    expect(within(table).getByRole("cell", { name: "2,931" })).toBeTruthy();
    expect(within(table).getByRole("cell", { name: "2.59" })).toBeTruthy();
  });

  it("switches to running totals", () => {
    render(<TrafficPage />);

    press("Values", "Running total");
    expect(
      screen.getByText("October 2026, running total", {
        selector: "[data-slot='card-description']",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: /October 2026, running total: 1,133 visitors, 2,931 page views/,
      }),
    ).toBeTruthy();
  });

  it("warns that a visitors running total counts returning visitors monthly", () => {
    render(<TrafficPage />);

    expect(screen.queryByText(/counted once per month/)).toBeNull();
    press("Values", "Running total");
    expect(screen.getByText(/counted once per month/)).toBeTruthy();
    press("Show", "Page views");
    expect(screen.queryByText(/counted once per month/)).toBeNull();
  });

  it("shows a tooltip with every series on keyboard focus", () => {
    render(<TrafficPage />);

    const month = screen.getByRole("img", { name: /October 2026: 1,133 visitors/ });
    fireEvent.focus(month);
    const chart = screen.getByRole("group", {
      name: "Visitors and page views per month",
    });
    expect(chart.textContent).toContain("Visitors");
    expect(chart.textContent).toContain("Page views");

    fireEvent.blur(month);
  });
});
