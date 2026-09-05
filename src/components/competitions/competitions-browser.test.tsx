import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompetitionsBrowser } from "@/components/competitions/competitions-browser";
import { EMPTY_COMPETITION_FILTERS } from "@/components/competitions/filters";
import type { Competition } from "@/lib/types";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/competitions",
}));

afterEach(() => {
  cleanup();
  replace.mockClear();
});

function competition(overrides: Partial<Competition> & { id: string }): Competition {
  return {
    name: overrides.id,
    organizer: "Test Org",
    organizer_url: "https://example.com",
    category: "stem",
    subjects: ["science"],
    description: "A test competition description.",
    format: "online",
    age_min: 13,
    age_max: 18,
    participation: "individual",
    region: "international",
    fee: { amount: 0, currency: "USD" },
    prize: "A prize",
    official_url: "https://example.com",
    cycle_year: 2027,
    dates: [
      {
        label: "Deadline",
        date: "2027-06-01",
        type: "deadline",
        timezone: "UTC",
        estimated: false,
        source_url: "https://example.com",
      },
    ],
    added_by: "test",
    ...overrides,
  };
}

const FIXTURE: Competition[] = [
  competition({
    id: "stem-one",
    category: "stem",
    name: "Stem Competition",
    region: "international",
  }),
  competition({
    id: "coding-one",
    category: "coding",
    name: "Coding Competition",
    region: "US",
  }),
];

const NOW_ISO = "2026-06-01T00:00:00Z";

describe("CompetitionsBrowser", () => {
  it("renders every competition when no filters are active", () => {
    render(
      <CompetitionsBrowser
        competitions={FIXTURE}
        nowIso={NOW_ISO}
        initialFilters={EMPTY_COMPETITION_FILTERS}
      />,
    );

    expect(screen.getByText("Stem Competition")).toBeTruthy();
    expect(screen.getByText("Coding Competition")).toBeTruthy();
    expect(screen.getByText("2 of 2 competitions")).toBeTruthy();
  });

  it("filters by category chip and updates the URL", () => {
    render(
      <CompetitionsBrowser
        competitions={FIXTURE}
        nowIso={NOW_ISO}
        initialFilters={EMPTY_COMPETITION_FILTERS}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "STEM" }));

    expect(screen.getByText("Stem Competition")).toBeTruthy();
    expect(screen.queryByText("Coding Competition")).toBeNull();
    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("categories=stem"),
      expect.anything(),
    );
  });

  it("marks the active category chip with aria-pressed", () => {
    render(
      <CompetitionsBrowser
        competitions={FIXTURE}
        nowIso={NOW_ISO}
        initialFilters={EMPTY_COMPETITION_FILTERS}
      />,
    );

    const chip = screen.getByRole("button", { name: "STEM" });
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("true");
  });

  it("composes a category filter and a search query with AND semantics", () => {
    render(
      <CompetitionsBrowser
        competitions={FIXTURE}
        nowIso={NOW_ISO}
        initialFilters={EMPTY_COMPETITION_FILTERS}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Coding" }));
    fireEvent.change(screen.getByPlaceholderText("Search competitions..."), {
      target: { value: "stem" },
    });

    expect(
      screen.getByText(
        (_, el) =>
          el?.textContent ===
          'No competitions match categories: Coding · search: "stem".',
      ),
    ).toBeTruthy();
  });

  it("shows an empty state naming the active filters, with a one-click clear", () => {
    render(
      <CompetitionsBrowser
        competitions={FIXTURE}
        nowIso={NOW_ISO}
        initialFilters={{
          ...EMPTY_COMPETITION_FILTERS,
          query: "does not exist anywhere",
        }}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      'No competitions match search: "does not exist anywhere".',
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("2 of 2 competitions")).toBeTruthy();
  });

  it("seeds filter state from initialFilters, round-tripping through the URL", () => {
    render(
      <CompetitionsBrowser
        competitions={FIXTURE}
        nowIso={NOW_ISO}
        initialFilters={{ ...EMPTY_COMPETITION_FILTERS, categories: ["coding"] }}
      />,
    );

    expect(screen.queryByText("Stem Competition")).toBeNull();
    expect(screen.getByText("Coding Competition")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Coding" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
