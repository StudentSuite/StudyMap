import { describe, expect, it } from "vitest";

import {
  findSameNamePlaces,
  gmapsLinkCoordinates,
  normalizePlaceName,
} from "../../scripts/lib/data-validation.mjs";

describe("gmapsLinkCoordinates", () => {
  it("reads the lat/lng from a ?q=<lat>,<lng> link", () => {
    expect(
      gmapsLinkCoordinates("https://maps.google.com/?q=23.021537,72.580057"),
    ).toEqual({
      lat: 23.021537,
      lng: 72.580057,
    });
  });

  it("handles negative coordinates and integer parts", () => {
    expect(gmapsLinkCoordinates("https://maps.google.com/?q=-33.8688,151")).toEqual({
      lat: -33.8688,
      lng: 151,
    });
  });

  it("returns null for links in other forms", () => {
    expect(gmapsLinkCoordinates("https://maps.google.com/?cid=12345")).toBeNull();
    expect(gmapsLinkCoordinates("https://maps.app.goo.gl/abc123")).toBeNull();
    expect(gmapsLinkCoordinates("https://maps.google.com/?q=Eiffel+Tower")).toBeNull();
    expect(gmapsLinkCoordinates("https://maps.google.com/?q=lat,lng")).toBeNull();
  });

  it("returns null for a value that is not a string", () => {
    expect(gmapsLinkCoordinates(undefined)).toBeNull();
    expect(gmapsLinkCoordinates(42)).toBeNull();
  });
});

describe("normalizePlaceName", () => {
  it("lowercases, folds diacritics, drops punctuation and collapses spaces", () => {
    expect(normalizePlaceName("  Biblioteca  Pública, Estadual! ")).toBe(
      "biblioteca publica estadual",
    );
    expect(normalizePlaceName("Zayed Central Library")).toBe("zayed central library");
  });

  it("returns an empty string for a non-string", () => {
    expect(normalizePlaceName(null)).toBe("");
  });
});

describe("findSameNamePlaces", () => {
  const place = (file: string, id: string, city: string, name: string) => ({
    file,
    id,
    city,
    name,
  });

  it("groups records with the same city and normalised name across files", () => {
    const groups = findSameNamePlaces([
      place("library.json", "ldn-library-01", "london", "The British Library"),
      place("other_places.json", "lhr-other_places-01", "london", "the british library"),
      place("library.json", "ldn-library-02", "london", "Another Library"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((r: { id: string }) => r.id)).toEqual([
      "ldn-library-01",
      "lhr-other_places-01",
    ]);
  });

  it("does not group the same name in different cities", () => {
    const groups = findSameNamePlaces([
      place("sat_centre.json", "1", "london", "London International Academy"),
      place("sat_centre.json", "2", "london_ontario", "London International Academy"),
    ]);
    expect(groups).toEqual([]);
  });

  it("returns nothing when every name is distinct", () => {
    expect(
      findSameNamePlaces([
        place("a.json", "1", "x", "One"),
        place("a.json", "2", "x", "Two"),
      ]),
    ).toEqual([]);
  });
});
