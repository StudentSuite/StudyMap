import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MapView from "@/components/map/map-view";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("MapView configuration", () => {
  it("shows actionable guidance when the MapTiler key is blank", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_KEY", "   ");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<MapView places={[]} />);

    expect(screen.getByRole("status", { name: "Basemap unavailable" })).toBeTruthy();
    expect(screen.getByText("NEXT_PUBLIC_MAPTILER_KEY")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Open the self-hosting setup" })
        .getAttribute("href"),
    ).toBe("/docs/self-hosting");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_MAPTILER_KEY is missing"),
    );
  });
});
