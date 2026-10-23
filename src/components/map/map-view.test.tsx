import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MapView from "@/components/map/map-view";

vi.mock("react-leaflet", async () => {
  const React = await import("react");
  const map = {
    getBounds: () => ({
      getWest: () => -1,
      getSouth: () => -1,
      getEast: () => 1,
      getNorth: () => 1,
    }),
    getZoom: () => 18,
    getContainer: () => document.createElement("div"),
    fitBounds: vi.fn(),
    scrollWheelZoom: { disable: vi.fn(), enable: vi.fn(), enabled: () => false },
    on: vi.fn(),
    off: vi.fn(),
  };
  return {
    MapContainer: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    Marker: ({ title }: React.PropsWithChildren<{ title?: string }>) => (
      <div role="button" title={title} />
    ),
    Popup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    TileLayer: () => null,
    Tooltip: () => null,
    CircleMarker: () => null,
    useMap: () => map,
  };
});

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

  it("gives a single place pin an accessible name with its category", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_KEY", "test-key");
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    render(
      <MapView
        places={[
          {
            id: "heathrow",
            name: "Heathrow Airport",
            type: "airport",
            city: "london",
            lat: 0,
            lng: 0,
            gmaps_link: "",
            added_by: "test",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Heathrow Airport, Airport/ }),
    ).toBeTruthy();
  });
});
