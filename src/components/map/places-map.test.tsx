import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlacesMap } from "@/components/map/places-map";
import type { MapViewport } from "@/components/map/map-view";
import type { Place } from "@/lib/types";

const { renderMap } = vi.hoisted(() => ({
  renderMap: vi.fn<
    (props: {
      places: Place[];
      focusId: string | null;
      initialViewport: MapViewport | null;
    }) => null
  >(() => null),
}));

vi.mock("next/dynamic", () => ({ default: () => renderMap }));
vi.mock("@/components/map/map-sheet", () => ({
  MapSheet: () => null,
  SHEET_SNAP_POINTS: ["144px", 0.48, 0.92],
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => null }));

function place(overrides: Partial<Place> & Pick<Place, "id" | "name">): Place {
  return {
    type: "library",
    city: "mumbai",
    lat: 19.0176,
    lng: 72.8562,
    gmaps_link: "https://maps.google.com/?q=19.0176,72.8562",
    added_by: "test",
    ...overrides,
  };
}

const PLACES: Place[] = [
  place({ id: "city-library", name: "City Library" }),
  place({ id: "reading-room", name: "Riverside Reading Room" }),
  place({ id: "airport", name: "City Airport", type: "airport" }),
  place({ id: "thane-library", name: "Thane Library", city: "thane" }),
];
const FILTERED_URL =
  "/map?types=library&city=mumbai&q=Library&place=city-library&lat=19.125&lng=72.375&zoom=11";
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const writeText = vi.fn<(text: string) => Promise<void>>();

function searchInputs() {
  return screen.getAllByRole<HTMLInputElement>("searchbox", {
    name: "Search places by name or city",
  });
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function params() {
  return new URLSearchParams(window.location.search);
}

function expectExistingState() {
  expect(params().get("types")).toBe("library");
  expect(params().get("city")).toBe("mumbai");
  expect(params().get("place")).toBe("city-library");
  expect(params().get("lat")).toBe("19.125");
  expect(params().get("lng")).toBe("72.375");
  expect(params().get("zoom")).toBe("11");
}

function stubViewport(desktop: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: desktop && query === "(min-width: 1024px)",
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  vi.useFakeTimers();
  stubViewport(true);
  window.history.replaceState(null, "", "/map");
  renderMap.mockClear();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

describe("PlacesMap search URLs", () => {
  it("keeps an initial query and the other shared state after mounting", () => {
    window.history.replaceState(null, "", FILTERED_URL);
    render(<PlacesMap places={PLACES} />);

    expect(searchInputs().map((input) => input.value)).toEqual(["Library", "Library"]);
    expect(screen.getByText("City Library")).toBeTruthy();
    expect(screen.queryByText("Riverside Reading Room")).toBeNull();
    expect(screen.queryByText("City Airport")).toBeNull();
    expect(screen.queryByText("Thane Library")).toBeNull();
    expect(params().get("q")).toBe("Library");
    expectExistingState();
    expect(
      screen.getByRole("button", { name: /^Library\s*1$/ }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect((screen.getByLabelText("Filter by city") as HTMLInputElement).value).toBe(
      "Mumbai",
    );
    expect(renderMap.mock.lastCall?.[0]).toMatchObject({
      places: [PLACES[0]],
      focusId: "city-library",
      initialViewport: { lat: 19.125, lng: 72.375, zoom: 11 },
    });
  });

  it("updates results and the URL only after the latest input has settled", () => {
    render(<PlacesMap places={PLACES} />);
    const replace = vi.spyOn(window.history, "replaceState");
    const historyLength = window.history.length;
    const [desktop, mobile] = searchInputs();

    fireEvent.change(desktop, { target: { value: "Library" } });
    advance(200);
    fireEvent.change(mobile, { target: { value: "Reading" } });
    advance(249);

    expect(searchInputs().map((input) => input.value)).toEqual(["Reading", "Reading"]);
    expect(screen.getByText("City Library")).toBeTruthy();
    expect(screen.getByText("Riverside Reading Room")).toBeTruthy();
    expect(screen.getByText("City Airport")).toBeTruthy();
    expect(screen.getByText("Thane Library")).toBeTruthy();
    expect(params().has("q")).toBe(false);
    expect(replace).not.toHaveBeenCalled();

    advance(1);

    expect(screen.queryByText("City Library")).toBeNull();
    expect(screen.getByText("Riverside Reading Room")).toBeTruthy();
    expect(screen.queryByText("City Airport")).toBeNull();
    expect(screen.queryByText("Thane Library")).toBeNull();
    expect(params().get("q")).toBe("Reading");
    expect(replace).toHaveBeenCalledOnce();
    expect(window.history.length).toBe(historyLength);
  });

  it("shares the applied query and restores the same results from the copied link", async () => {
    window.history.replaceState(null, "", FILTERED_URL);
    const view = render(<PlacesMap places={PLACES} />);
    fireEvent.change(searchInputs()[0], { target: { value: "Reading" } });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy a shareable link to this view" }),
      );
    });
    expect(new URL(writeText.mock.calls[0][0]).searchParams.get("q")).toBe("Library");
    expect(screen.getByText("City Library")).toBeTruthy();

    advance(250);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy a shareable link to this view" }),
      );
    });
    const copied = new URL(writeText.mock.calls[1][0]);
    expect(copied.searchParams.get("q")).toBe("Reading");
    expect(copied.pathname).toBe("/map");
    view.unmount();
    window.history.replaceState(null, "", copied.href);
    render(<PlacesMap places={PLACES} />);

    expect(searchInputs().map((input) => input.value)).toEqual(["Reading", "Reading"]);
    expect(screen.getByText("Riverside Reading Room")).toBeTruthy();
    expect(screen.queryByText("City Library")).toBeNull();
    expect(params().get("q")).toBe("Reading");
    expectExistingState();
  });

  it("clears the query without waiting 250 ms or losing the other shared state", () => {
    window.history.replaceState(null, "", FILTERED_URL);
    render(<PlacesMap places={PLACES} />);

    fireEvent.change(searchInputs()[0], { target: { value: "" } });
    advance(0);

    expect(searchInputs().every((input) => input.value === "")).toBe(true);
    expect(params().has("q")).toBe(false);
    expectExistingState();
    expect(screen.getByText("City Library")).toBeTruthy();
    expect(screen.getByText("Riverside Reading Room")).toBeTruthy();
    expect(screen.queryByText("City Airport")).toBeNull();
    expect(screen.queryByText("Thane Library")).toBeNull();
  });

  it("resets the search and filters to an unfiltered URL", () => {
    window.history.replaceState(null, "", "/map?q=Library&types=library&city=mumbai");
    render(<PlacesMap places={PLACES} />);

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    advance(0);

    expect(window.location.search).toBe("");
    expect(searchInputs().every((input) => input.value === "")).toBe(true);
    for (const item of PLACES) {
      expect(screen.getByText(item.name)).toBeTruthy();
    }
  });
});

describe("PlacesMap panel mounting", () => {
  it("mounts the sidebar panel at desktop width", () => {
    render(<PlacesMap places={PLACES} />);

    // Sidebar search + mobile top bar search.
    expect(searchInputs()).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Suggest a place" })).toHaveLength(1);
  });

  it("does not build the sidebar panel on a phone", () => {
    stubViewport(false);
    render(<PlacesMap places={PLACES} />);

    // Only the mobile top bar search; the sheet is closed at peek height.
    expect(searchInputs()).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Suggest a place" })).toBeNull();
    expect(screen.queryByText("City Library")).toBeNull();
  });
});
