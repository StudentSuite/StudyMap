import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// SaveButton is out of scope for this test file (see save-button.test.tsx);
// rendering with Supabase unconfigured keeps it a no-op here.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/competitions",
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => null }));

import { CompetitionDetail } from "@/components/competitions/competition-detail";
import type { Competition } from "@/lib/types";

afterEach(cleanup);

const NOW = new Date("2026-06-01T00:00:00Z");

function competition(overrides: Partial<Competition> & { id: string }): Competition {
  return {
    name: overrides.id,
    organizer: "Test Organizer",
    organizer_url: "https://organizer.example.com",
    category: "stem",
    subjects: ["science"],
    description: "A test competition description.",
    format: "online",
    age_min: 13,
    age_max: 18,
    participation: "individual",
    region: "US",
    fee: { amount: 0, currency: "USD" },
    prize: "A great prize",
    official_url: "https://official.example.com",
    cycle_year: 2027,
    dates: [
      {
        label: "Registration opens",
        date: "2026-07-01",
        type: "registration_open",
        timezone: "UTC-4",
        estimated: false,
        source_url: "https://official.example.com/reg-open",
      },
      {
        label: "Submission deadline",
        date: "2026-09-01",
        type: "deadline",
        timezone: "UTC-4",
        estimated: true,
        source_url: "https://official.example.com/deadline",
      },
    ],
    added_by: "test",
    ...overrides,
  };
}

describe("CompetitionDetail", () => {
  it("renders the header, organizer link and category chip", () => {
    const c = competition({ id: "test-1", name: "Test Competition" });
    render(<CompetitionDetail competition={c} related={[]} now={NOW} />);

    expect(screen.getByRole("heading", { name: "Test Competition" })).toBeTruthy();
    const organizerLink = screen.getByRole("link", { name: "Test Organizer" });
    expect(organizerLink.getAttribute("href")).toBe("https://organizer.example.com");
    expect(screen.getByText("STEM")).toBeTruthy();
  });

  it("renders the registration facts", () => {
    const c = competition({ id: "test-2" });
    render(<CompetitionDetail competition={c} related={[]} now={NOW} />);

    expect(screen.getByText("Online")).toBeTruthy();
    expect(screen.getByText("13-18")).toBeTruthy();
    expect(screen.getByText("Individual")).toBeTruthy();
    expect(screen.getByText("United States")).toBeTruthy();
    expect(screen.getByText("Free")).toBeTruthy();
    expect(screen.getByText("A great prize")).toBeTruthy();
  });

  it("renders every dates[] entry with a link to its own source", () => {
    const c = competition({ id: "test-3" });
    render(<CompetitionDetail competition={c} related={[]} now={NOW} />);

    expect(screen.getAllByText("Registration opens").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Submission deadline").length).toBeGreaterThan(0);
    const sourceLinks = screen.getAllByRole("link", { name: "source" });
    expect(sourceLinks.map((link) => link.getAttribute("href"))).toEqual([
      "https://official.example.com/reg-open",
      "https://official.example.com/deadline",
    ]);
  });

  it("marks an estimated timeline entry as approximate", () => {
    const c = competition({ id: "test-4" });
    render(<CompetitionDetail competition={c} related={[]} now={NOW} />);
    expect(screen.getByText("approximate")).toBeTruthy();
  });

  it("omits the country pathways section entirely when there are no country_tracks", () => {
    const c = competition({ id: "test-5" });
    render(<CompetitionDetail competition={c} related={[]} now={NOW} />);
    expect(screen.queryByText("Country pathways")).toBeNull();
  });

  it("renders the country pathways section when country_tracks is present", () => {
    const c = competition({
      id: "test-6",
      country_tracks: [
        {
          country: "IN",
          official_url: "https://iarcs.org.in",
          stages: [
            {
              name: "ZIO",
              date: "2026-11-01",
              estimated: true,
              source_url: "https://iarcs.org.in/zio",
            },
          ],
        },
      ],
    });
    render(<CompetitionDetail competition={c} related={[]} now={NOW} />);
    expect(screen.getByText("Country pathways")).toBeTruthy();
  });

  it("links to the official site", () => {
    const c = competition({ id: "test-7" });
    render(<CompetitionDetail competition={c} related={[]} now={NOW} />);
    expect(
      screen.getByRole("link", { name: "Visit the official site" }).getAttribute("href"),
    ).toBe("https://official.example.com");
  });

  it("renders related competitions when given", () => {
    const c = competition({ id: "test-8" });
    const related = [competition({ id: "related-1", name: "Related One" })];
    render(<CompetitionDetail competition={c} related={related} now={NOW} />);
    expect(screen.getByRole("link", { name: /Related One/ }).getAttribute("href")).toBe(
      "/competitions/related-1",
    );
  });

  it("omits the related section when there are none", () => {
    const c = competition({ id: "test-9" });
    render(<CompetitionDetail competition={c} related={[]} now={NOW} />);
    expect(screen.queryByLabelText("Related competitions")).toBeNull();
  });
});
