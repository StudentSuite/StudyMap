import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResultsList, type ResultRow } from "@/components/map/results-list";

beforeEach(() => {
  // The verified badge expires with time, so these tests run on a fixed date.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-21T12:00:00Z"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ResultsList empty state", () => {
  it("describes active filters and offers reset and contribution actions", () => {
    const onReset = vi.fn();
    const onSuggest = vi.fn();

    render(
      <ResultsList
        header="All places"
        rows={[]}
        emptyState={{
          activeFilters: ["types: Library", "city: Thane"],
          onReset,
          onSuggest,
        }}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "No places match types: Library · city: Thane.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Suggest a place" }));

    expect(onReset).toHaveBeenCalledOnce();
    expect(onSuggest).toHaveBeenCalledOnce();
  });
});

describe("ResultsList verified badge", () => {
  const place = {
    id: "mum-library-07",
    name: "City Library",
    type: "library" as const,
    city: "mumbai",
    lat: 19.0176,
    lng: 72.8562,
    gmaps_link: "https://maps.google.com/?q=19.0176,72.8562",
    added_by: "someone",
  };

  it("shows a badge for verified places", () => {
    render(
      <ResultsList
        header="All places"
        rows={[{ place: { ...place, verified: { by: "verifier", on: "2026-08-01" } } }]}
        emptyState={{ activeFilters: [], onReset: vi.fn(), onSuggest: vi.fn() }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Verified")).toBeTruthy();
  });

  it("shows no badge for unverified places", () => {
    render(
      <ResultsList
        header="All places"
        rows={[{ place }]}
        emptyState={{ activeFilters: [], onReset: vi.fn(), onSuggest: vi.fn() }}
        onSelect={vi.fn()}
      />,
    );
    const row = screen.getByText("City Library").closest("li");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).queryByText("Verified")).toBeNull();
  });
});

describe("ResultsList paging", () => {
  const rowsOf = (count: number): ResultRow[] =>
    Array.from({ length: count }, (_, i) => ({
      place: {
        id: `place-${i}`,
        name: `Place ${i}`,
        type: "library" as const,
        city: "mumbai",
        lat: 19,
        lng: 72,
        gmaps_link: "https://maps.google.com/?q=19,72",
        added_by: "test",
      },
    }));
  const emptyState = { activeFilters: [], onReset: vi.fn(), onSuggest: vi.fn() };

  it("renders one page of rows and a Show more button for the rest", () => {
    render(
      <ResultsList
        header="All places"
        rows={rowsOf(250)}
        emptyState={emptyState}
        onSelect={vi.fn()}
        pageSize={100}
      />,
    );

    expect(screen.getByText("Place 99")).toBeTruthy();
    expect(screen.queryByText("Place 100")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show 100 more (150 not shown)" }),
    ).toBeTruthy();
  });

  it("reveals the next page and then the remainder", () => {
    render(
      <ResultsList
        header="All places"
        rows={rowsOf(250)}
        emptyState={emptyState}
        onSelect={vi.fn()}
        pageSize={100}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Show 100 more/ }));
    expect(screen.getByText("Place 199")).toBeTruthy();
    expect(screen.queryByText("Place 200")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show 50 more (50 not shown)" }));
    expect(screen.getByText("Place 249")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Show .* more/ })).toBeNull();
  });

  it("shows no button when everything fits on one page", () => {
    render(
      <ResultsList
        header="All places"
        rows={rowsOf(100)}
        emptyState={emptyState}
        onSelect={vi.fn()}
        pageSize={100}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(100);
    expect(screen.queryByRole("button", { name: /Show .* more/ })).toBeNull();
  });

  it("keeps the focused row visible even when it is beyond the first page", () => {
    render(
      <ResultsList
        header="All places"
        rows={rowsOf(250)}
        emptyState={emptyState}
        onSelect={vi.fn()}
        focusId="place-230"
        pageSize={100}
      />,
    );

    const row = screen.getByText("Place 230").closest("li");
    expect(row).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Show 100 more (149 not shown)" }),
    ).toBeTruthy();
  });

  it("starts again from the first page when the result set changes", () => {
    const first = rowsOf(250);
    const { rerender } = render(
      <ResultsList
        header="All places"
        rows={first}
        emptyState={emptyState}
        onSelect={vi.fn()}
        pageSize={100}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Show 100 more/ }));
    expect(screen.getByText("Place 150")).toBeTruthy();

    rerender(
      <ResultsList
        header="All places"
        rows={rowsOf(250)}
        emptyState={emptyState}
        onSelect={vi.fn()}
        pageSize={100}
      />,
    );

    expect(screen.queryByText("Place 150")).toBeNull();
    expect(screen.getByText("Place 99")).toBeTruthy();
  });
});
