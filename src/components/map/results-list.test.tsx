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

describe("ResultsList details and compare", () => {
  const rowsOf = (n: number): ResultRow[] =>
    Array.from({ length: n }, (_, i) => ({
      place: {
        id: "p" + i,
        name: "Place " + i,
        type: "library" as const,
        city: "mumbai",
        lat: 19 + i / 100,
        lng: 72.8,
        gmaps_link: "https://maps.google.com/?q=19,72.8",
        added_by: "test",
      },
    }));
  const emptyState = { activeFilters: [], onReset: vi.fn(), onSuggest: vi.fn() };

  it("opens the details for the row's place", () => {
    const onDetails = vi.fn();
    render(
      <ResultsList
        header="All places"
        rows={rowsOf(2)}
        emptyState={emptyState}
        onSelect={vi.fn()}
        onDetails={onDetails}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Details for Place 1" }));

    expect(onDetails).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));
  });

  it("shows no details button or checkbox unless asked", () => {
    render(
      <ResultsList
        header="All places"
        rows={rowsOf(1)}
        emptyState={emptyState}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /Details for/ })).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("needs two picks before Compare is enabled and caps the picks at the maximum", () => {
    const onToggle = vi.fn();
    const onOpen = vi.fn();
    const base = { max: 3, onToggle, onOpen, onClear: vi.fn() };
    const rows = rowsOf(4);
    const { rerender } = render(
      <ResultsList
        header="All places"
        rows={rows}
        emptyState={emptyState}
        onSelect={vi.fn()}
        compare={{ ...base, selectedIds: ["p0"] }}
      />,
    );

    expect(
      (screen.getByRole("button", { name: "Compare (1)" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    rerender(
      <ResultsList
        header="All places"
        rows={rows}
        emptyState={emptyState}
        onSelect={vi.fn()}
        compare={{ ...base, selectedIds: ["p0", "p1", "p2"] }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Compare (3)" }));
    expect(onOpen).toHaveBeenCalled();
    expect(
      (screen.getByRole("checkbox", { name: "Compare Place 3" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("checkbox", { name: "Compare Place 1" }) as HTMLInputElement)
        .disabled,
    ).toBe(false);
    fireEvent.click(screen.getByRole("checkbox", { name: "Compare Place 1" }));
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));
  });
});

describe("ResultsList row location (#354)", () => {
  const base = {
    type: "airport" as const,
    lat: 19,
    lng: 72,
    gmaps_link: "https://maps.google.com/?q=19,72",
    added_by: "test",
  };
  const emptyState = { activeFilters: [], onReset: vi.fn(), onSuggest: vi.fn() };

  it("tells two places with the same name apart by city and country", () => {
    render(
      <ResultsList
        header="All places"
        rows={[
          {
            place: {
              ...base,
              id: "mumbai-airport",
              name: "Chhatrapati Shivaji Maharaj International Airport",
              city: "mumbai",
              country: "IN",
            },
          },
          {
            place: {
              ...base,
              id: "other-airport",
              name: "Chhatrapati Shivaji Maharaj International Airport",
              city: "nagpur",
              country: "IN",
            },
          },
        ]}
        emptyState={emptyState}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/Airport · Mumbai, India/)).toBeTruthy();
    expect(screen.getByText(/Airport · Nagpur, India/)).toBeTruthy();
  });

  it("puts the distance after the location when it is known", () => {
    render(
      <ResultsList
        header="Nearest to you"
        rows={[
          {
            place: { ...base, id: "a", name: "Heathrow", city: "london", country: "GB" },
            distanceKm: 2.5,
          },
        ]}
        emptyState={emptyState}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/Airport · London, United Kingdom · /)).toBeTruthy();
  });

  it("omits the country, with no stray comma, for a private place that has none", () => {
    render(
      <ResultsList
        header="All places"
        rows={[{ place: { ...base, id: "own-1", name: "My spot", city: "thane" } }]}
        emptyState={emptyState}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Airport · Thane")).toBeTruthy();
  });

  it("lets the name wrap to two lines instead of truncating to one", () => {
    render(
      <ResultsList
        header="All places"
        rows={[
          { place: { ...base, id: "a", name: "A very long place name", city: "mumbai" } },
        ]}
        emptyState={emptyState}
        onSelect={vi.fn()}
      />,
    );

    const name = screen.getByText("A very long place name");
    expect(name.className).toContain("line-clamp-2");
    expect(name.className).not.toContain("truncate");
  });

  it("keeps the accessible names of the row actions", () => {
    render(
      <ResultsList
        header="All places"
        rows={[{ place: { ...base, id: "a", name: "Heathrow", city: "london" } }]}
        emptyState={emptyState}
        onSelect={vi.fn()}
        onDetails={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Details for Heathrow" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Open Heathrow in Google Maps" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Directions to Heathrow" })).toBeTruthy();
  });
});
