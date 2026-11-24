import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FIT_MAX_ZOOM,
  GO_TO_PLACE_ZOOM,
  fitMaxZoom,
  hasExplicitIntent,
  loadViewport,
  parseStoredViewport,
  saveViewport,
} from "@/components/map/viewport";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("fitMaxZoom", () => {
  it("lets a single place go to street level but never past the cap", () => {
    expect(fitMaxZoom(1)).toBe(FIT_MAX_ZOOM);
    expect(FIT_MAX_ZOOM).toBeLessThanOrEqual(16);
  });

  it("keeps a group of places at the go-to-place zoom or wider", () => {
    expect(fitMaxZoom(2)).toBe(GO_TO_PLACE_ZOOM);
    expect(fitMaxZoom(500)).toBe(GO_TO_PLACE_ZOOM);
  });

  it("treats an empty result like a single place", () => {
    expect(fitMaxZoom(0)).toBe(FIT_MAX_ZOOM);
  });
});

describe("parseStoredViewport", () => {
  it("accepts a valid viewport", () => {
    expect(parseStoredViewport('{"lat":19.07,"lng":72.87,"zoom":11}')).toEqual({
      lat: 19.07,
      lng: 72.87,
      zoom: 11,
    });
  });

  it.each([
    [null],
    [""],
    ["not json"],
    ["null"],
    ["[]"],
    ['{"lat":"1","lng":2,"zoom":3}'],
    ['{"lat":91,"lng":0,"zoom":3}'],
    ['{"lat":0,"lng":181,"zoom":3}'],
    ['{"lat":0,"lng":0,"zoom":-1}'],
    ['{"lat":0,"lng":0,"zoom":40}'],
    ['{"lat":0,"lng":0}'],
  ])("rejects %s", (raw) => {
    expect(parseStoredViewport(raw)).toBeNull();
  });
});

describe("loadViewport and saveViewport", () => {
  it("round-trips a viewport", () => {
    saveViewport({ lat: 6.52, lng: 3.37, zoom: 12 });
    expect(loadViewport()).toEqual({ lat: 6.52, lng: 3.37, zoom: 12 });
  });

  it("returns null when nothing was saved", () => {
    expect(loadViewport()).toBeNull();
  });

  it("returns null instead of throwing when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadViewport()).toBeNull();
  });

  it("does not throw when saving to blocked storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveViewport({ lat: 1, lng: 2, zoom: 3 })).not.toThrow();
  });
});

describe("hasExplicitIntent", () => {
  it("is false for a bare /map", () => {
    expect(
      hasExplicitIntent({
        placeId: null,
        query: "",
        city: null,
        country: null,
        types: [],
      }),
    ).toBe(false);
  });

  it.each([
    [{ placeId: "x" }],
    [{ query: "esenboga" }],
    [{ city: "mumbai" }],
    [{ country: "IN" }],
    [{ types: ["library"] }],
  ])("is true for %o", (intent) => {
    expect(hasExplicitIntent(intent)).toBe(true);
  });

  it("ignores a whitespace-only query", () => {
    expect(hasExplicitIntent({ query: "   " })).toBe(false);
  });
});
