import { describe, expect, it } from "vitest";

import {
  IN_VIEW_AUTO_ZOOM,
  filterByBounds,
  inBounds,
  sameBounds,
  wantsInView,
  type MapBounds,
} from "@/components/map/filters";

const LAGOS: MapBounds = { west: 3.0, south: 6.3, east: 3.7, north: 6.8 };

const place = (id: string, lat: number, lng: number) => ({ id, lat, lng });

describe("inBounds", () => {
  it("includes a point inside and on the edge", () => {
    expect(inBounds({ lat: 6.52, lng: 3.37 }, LAGOS)).toBe(true);
    expect(inBounds({ lat: 6.3, lng: 3.0 }, LAGOS)).toBe(true);
    expect(inBounds({ lat: 6.8, lng: 3.7 }, LAGOS)).toBe(true);
  });

  it("excludes points outside on either axis", () => {
    expect(inBounds({ lat: 51.47, lng: -0.45 }, LAGOS)).toBe(false);
    expect(inBounds({ lat: 6.52, lng: 4.0 }, LAGOS)).toBe(false);
    expect(inBounds({ lat: 7.0, lng: 3.37 }, LAGOS)).toBe(false);
  });

  it("handles a view that crosses the antimeridian", () => {
    const fiji: MapBounds = { west: 170, south: -25, east: 190, north: -10 };
    expect(inBounds({ lat: -18, lng: 178 }, fiji)).toBe(true);
    expect(inBounds({ lat: -18, lng: -178 }, fiji)).toBe(true);
    expect(inBounds({ lat: -18, lng: 160 }, fiji)).toBe(false);
    expect(inBounds({ lat: -18, lng: -160 }, fiji)).toBe(false);
  });

  it("includes every longitude once the view is a full world wide", () => {
    const world: MapBounds = { west: -200, south: -80, east: 200, north: 80 };
    expect(inBounds({ lat: 10, lng: 123 }, world)).toBe(true);
    expect(inBounds({ lat: 85, lng: 123 }, world)).toBe(false);
  });
});

describe("filterByBounds", () => {
  it("lists only the places in view, keeping their order", () => {
    const places = [
      place("heathrow", 51.47, -0.45),
      place("ikeja", 6.6, 3.34),
      place("lekki", 6.45, 3.55),
      place("jfk", 40.64, -73.78),
    ];

    expect(filterByBounds(places, LAGOS).map((p) => p.id)).toEqual(["ikeja", "lekki"]);
  });

  it("returns nothing when no place is in view", () => {
    expect(filterByBounds([place("jfk", 40.64, -73.78)], LAGOS)).toEqual([]);
  });
});

describe("sameBounds", () => {
  it("treats a tiny nudge as the same view", () => {
    expect(sameBounds(LAGOS, { ...LAGOS, east: 3.7002 })).toBe(true);
  });

  it("treats a real pan as a different view", () => {
    expect(sameBounds(LAGOS, { west: 8, south: 6.3, east: 8.7, north: 6.8 })).toBe(false);
  });
});

describe("wantsInView", () => {
  it("follows the zoom when the visitor has not chosen", () => {
    expect(wantsInView(null, IN_VIEW_AUTO_ZOOM - 1)).toBe(false);
    expect(wantsInView(null, IN_VIEW_AUTO_ZOOM)).toBe(true);
  });

  it("obeys an explicit choice at any zoom", () => {
    expect(wantsInView(true, 2)).toBe(true);
    expect(wantsInView(false, 15)).toBe(false);
  });
});
