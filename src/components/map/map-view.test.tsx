import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MapView, { pinIcon } from "@/components/map/map-view";

const { flyTo, fitBounds, setView, setMinZoom } = vi.hoisted(() => ({
  flyTo: vi.fn(),
  fitBounds: vi.fn(),
  setView: vi.fn(),
  setMinZoom: vi.fn(),
}));

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
    fitBounds,
    flyTo,
    setView,
    setMinZoom,
    getBoundsZoom: () => 2,
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

const VIEW = { center: [19.08, 72.95] as [number, number], zoom: 11 };

describe("MapView configuration", () => {
  it("shows actionable guidance when the MapTiler key is blank", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_KEY", "   ");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<MapView places={[]} {...VIEW} />);

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
        {...VIEW}
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

  it("flies to the user without animation when prefers-reduced-motion is set", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_KEY", "test-key");
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    flyTo.mockClear();

    render(<MapView places={[]} {...VIEW} userLocation={{ lat: 19.2, lng: 72.9 }} />);

    expect(flyTo).toHaveBeenCalledWith(
      [19.2, 72.9],
      14,
      expect.objectContaining({ animate: false }),
    );
  });
});

describe("MapView start view", () => {
  const place = (id: string, lat: number, lng: number) => ({
    id,
    name: id,
    type: "library" as const,
    city: "london",
    lat,
    lng,
    gmaps_link: "",
    added_by: "test",
  });

  function setup() {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_KEY", "test-key");
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    fitBounds.mockClear();
    setView.mockClear();
    setMinZoom.mockClear();
  }

  it("caps the zoom when a search leaves a single place (#353)", () => {
    setup();
    render(<MapView {...VIEW} places={[place("one", 40.1, 33.0)]} />);

    expect(fitBounds).toHaveBeenCalledWith(
      [
        [40.1, 33.0],
        [40.1, 33.0],
      ],
      expect.objectContaining({ maxZoom: 16 }),
    );
  });

  it("caps the zoom lower when it fits several places (#353)", () => {
    setup();
    render(
      <MapView {...VIEW} places={[place("a", 51.5, -0.1), place("b", 51.6, -0.2)]} />,
    );

    expect(fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ maxZoom: 15 }),
    );
  });

  it("keeps the basemap covering the viewport with a minimum zoom (#350)", () => {
    setup();
    render(<MapView {...VIEW} places={[]} />);

    expect(setMinZoom).toHaveBeenCalledWith(2);
  });

  it("opens on the saved home instead of the whole world when nothing chose a view (#350)", () => {
    setup();
    render(
      <MapView
        {...VIEW}
        places={[place("a", 51.5, -0.1)]}
        home={{ lat: 6.52, lng: 3.37 }}
        openOnHome
      />,
    );

    expect(setView).toHaveBeenCalledTimes(1);
    expect(setView).toHaveBeenCalledWith([6.52, 3.37], 11, { animate: false });
    expect(fitBounds).not.toHaveBeenCalled();
  });

  it("ignores the saved home when a viewport was restored (#350)", () => {
    setup();
    render(
      <MapView
        {...VIEW}
        places={[place("a", 51.5, -0.1)]}
        home={{ lat: 6.52, lng: 3.37 }}
        initialViewport={{ lat: 1, lng: 2, zoom: 5 }}
      />,
    );

    expect(setView).not.toHaveBeenCalled();
    expect(fitBounds).not.toHaveBeenCalled();
  });
});

describe("pinIcon", () => {
  it("returns the same icon instance for the same place type", () => {
    expect(pinIcon("library")).toBe(pinIcon("library"));
  });

  it("returns a different icon for a different place type", () => {
    expect(pinIcon("library")).not.toBe(pinIcon("airport"));
  });
});
