import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResultsList } from "@/components/map/results-list";

afterEach(cleanup);

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
