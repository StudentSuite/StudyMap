import { describe, expect, it } from "vitest";

import { formatDistance, haversineKm, placesByDistance } from "@/lib/geo";
import type { Place } from "@/lib/types";

function place(id: string, lat: number, lng: number): Place {
  return {
    id,
    name: id,
    type: "library",
    city: "mumbai",
    lat,
    lng,
    gmaps_link: `https://maps.google.com/?q=${lat},${lng}`,
    added_by: "test",
  };
}

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm({ lat: 19.076, lng: 72.8777 }, { lat: 19.076, lng: 72.8777 })).toBe(0);
  });

  it("matches the known great-circle distance between Mumbai and Thane", () => {
    // Mumbai (CST) to Thane station, ~ 31 km apart.
    const km = haversineKm({ lat: 18.9401, lng: 72.8352 }, { lat: 19.1863, lng: 72.9781 });
    expect(km).toBeGreaterThan(28);
    expect(km).toBeLessThan(34);
  });

  it("is symmetric", () => {
    const a = { lat: 19.076, lng: 72.8777 };
    const b = { lat: 19.2183, lng: 72.9781 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});

describe("placesByDistance", () => {
  const origin = { lat: 19.076, lng: 72.8777 };
  const near = place("near", 19.077, 72.878);
  const mid = place("mid", 19.12, 72.9);
  const far = place("far", 19.5, 73.5);

  it("sorts places nearest first", () => {
    const sorted = placesByDistance([far, near, mid], origin);
    expect(sorted.map((p) => p.id)).toEqual(["near", "mid", "far"]);
  });

  it("tags each place with its distance from the origin", () => {
    const [sortedNear] = placesByDistance([near], origin);
    expect(sortedNear.distanceKm).toBeGreaterThanOrEqual(0);
    expect(sortedNear.distanceKm).toBeLessThan(1);
  });

  it("returns an empty array for an empty input", () => {
    expect(placesByDistance([], origin)).toEqual([]);
  });
});

describe("formatDistance", () => {
  it("formats sub-kilometre distances in metres", () => {
    expect(formatDistance(0.45)).toBe("450 m");
  });

  it("formats distances of a kilometre or more with one decimal", () => {
    expect(formatDistance(3.24)).toBe("3.2 km");
  });

  it("rounds metres to the nearest whole number", () => {
    expect(formatDistance(0.1234)).toBe("123 m");
  });
});
