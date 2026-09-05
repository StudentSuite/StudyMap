import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CountryTrackList } from "@/components/competitions/country-track-list";
import type { CompetitionCountryTrack } from "@/lib/types";

afterEach(cleanup);

const TRACKS: CompetitionCountryTrack[] = [
  {
    country: "IN",
    official_url: "https://www.iarcs.org.in/",
    stages: [
      {
        name: "ZIO",
        date: "2026-11-08",
        estimated: true,
        source_url: "https://www.iarcs.org.in/zio",
      },
    ],
  },
  {
    country: "US",
    official_url: "https://usaco.org/",
    stages: [
      {
        name: "USACO December contest",
        date: "2026-12-11",
        estimated: false,
        source_url: "https://usaco.org/december",
      },
    ],
  },
];

describe("CountryTrackList", () => {
  it("renders nothing when there are no country tracks", () => {
    const { container } = render(<CountryTrackList tracks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("defaults to the first track and shows its official site and stages", () => {
    render(<CountryTrackList tracks={TRACKS} />);
    expect(
      screen.getByRole("link", { name: "India official site" }).getAttribute("href"),
    ).toBe("https://www.iarcs.org.in/");
    expect(screen.getByText("ZIO")).toBeTruthy();
    expect(screen.getByText("approximate")).toBeTruthy();
  });

  it("defaults to the given country when it matches a track", () => {
    render(<CountryTrackList tracks={TRACKS} defaultCountry="US" />);
    expect(
      screen
        .getByRole("link", { name: "United States official site" })
        .getAttribute("href"),
    ).toBe("https://usaco.org/");
  });

  it("switches the active country when a picker button is clicked", () => {
    render(<CountryTrackList tracks={TRACKS} />);
    fireEvent.click(screen.getByRole("button", { name: "United States" }));
    expect(screen.getByText("USACO December contest")).toBeTruthy();
    expect(screen.queryByText("ZIO")).toBeNull();
  });

  it("links every stage to its source", () => {
    render(<CountryTrackList tracks={TRACKS} />);
    expect(screen.getByRole("link", { name: "source" }).getAttribute("href")).toBe(
      "https://www.iarcs.org.in/zio",
    );
  });
});
