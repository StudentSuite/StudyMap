import { describe, expect, it } from "vitest";

import { directionsUrl, PLACE_TYPE_COLORS } from "@/lib/map";
import type { PlaceType } from "@/lib/types";

describe("directionsUrl", () => {
  it("builds a Google Maps directions deep-link with the given coordinates", () => {
    expect(directionsUrl(19.076, 72.8777)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=19.076,72.8777",
    );
  });

  it("handles negative coordinates", () => {
    expect(directionsUrl(-33.8688, 151.2093)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-33.8688,151.2093",
    );
  });

  it("handles zero coordinates", () => {
    expect(directionsUrl(0, 0)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=0,0",
    );
  });
});

describe("PLACE_TYPE_COLORS", () => {
  it("defines a color for every PlaceType", () => {
    const types: PlaceType[] = [
      "library",
      "other_places",
      "airport",
      "sat_centre",
      "foreign_lang_exam_centre",
      "gov_offices",
    ];
    for (const type of types) {
      expect(PLACE_TYPE_COLORS[type]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("uses a distinct color per type", () => {
    const values = Object.values(PLACE_TYPE_COLORS);
    expect(new Set(values).size).toBe(values.length);
  });
});
