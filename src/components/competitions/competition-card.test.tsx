import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// SaveButton is out of scope for this test file (see save-button.test.tsx);
// rendering with Supabase unconfigured keeps it a no-op here.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/competitions",
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => null }));
// next/image needs a browser image pipeline that jsdom doesn't provide, so
// swap it for a plain <img> in the grid-image tests.
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const { fill, ...rest } = props;
    void fill;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

import { CompetitionCard } from "@/components/competitions/competition-card";
import type { Competition } from "@/lib/types";

afterEach(cleanup);

const COMPETITION: Competition = {
  id: "test-competition",
  name: "Test Competition",
  organizer: "Test Organizer",
  organizer_url: "https://example.com",
  category: "coding",
  subjects: ["cybersecurity"],
  description: "A test competition description that explains what students do.",
  format: "online",
  age_min: 13,
  age_max: 18,
  participation: "team",
  region: "US",
  fee: { amount: 0, currency: "USD" },
  prize: "A prize",
  official_url: "https://example.com",
  cycle_year: 2027,
  dates: [
    {
      label: "Submission deadline",
      date: "2027-06-01",
      type: "deadline",
      timezone: "UTC",
      estimated: false,
      source_url: "https://example.com",
    },
  ],
  added_by: "test",
};

describe("CompetitionCard", () => {
  const NOW = new Date("2026-06-01T00:00:00Z");

  it("renders the name, organizer, category chip, description and meta pills", () => {
    render(<CompetitionCard competition={COMPETITION} now={NOW} />);

    expect(screen.getByText("Test Competition")).toBeTruthy();
    expect(screen.getByText("Test Organizer")).toBeTruthy();
    expect(screen.getByText("Coding")).toBeTruthy();
    expect(screen.getByText(/A test competition description/)).toBeTruthy();
    expect(screen.getByText("Online")).toBeTruthy();
    expect(screen.getByText(/13-18/)).toBeTruthy();
    expect(screen.getByText("Team")).toBeTruthy();
    expect(screen.getByText("United States")).toBeTruthy();
  });

  it("links to the competition's detail page", () => {
    render(<CompetitionCard competition={COMPETITION} now={NOW} />);
    const link = screen.getByRole("link", { name: "View details" });
    expect(link.getAttribute("href")).toBe("/competitions/test-competition");
  });

  it("renders the logo in grid view and links it to the official site", () => {
    render(
      <CompetitionCard
        competition={{ ...COMPETITION, image: "/competitions/test-competition.png" }}
        now={NOW}
        variant="grid"
      />,
    );

    const img = screen.getByRole("img", { name: "Test Competition logo" });
    expect(img.getAttribute("src")).toBe("/competitions/test-competition.png");
    const banner = img.closest("a");
    expect(banner?.getAttribute("href")).toBe("https://example.com");
    expect(banner?.getAttribute("target")).toBe("_blank");
  });

  it("falls back to a placeholder icon in grid view when no image exists", () => {
    render(<CompetitionCard competition={COMPETITION} now={NOW} variant="grid" />);

    expect(screen.queryByRole("img", { name: /logo/ })).toBeNull();
  });
});
