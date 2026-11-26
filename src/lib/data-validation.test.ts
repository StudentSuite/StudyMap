import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  findSameNamePlaces,
  gmapsLinkCoordinates,
  isE164Phone,
  isHttpsUrl,
  isOpeningHours,
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

describe("isE164Phone (#356)", () => {
  it.each(["+442074127000", "+14155552671", "+912212345678", "+8613800138000"])(
    "accepts %s",
    (value) => {
      expect(isE164Phone(value)).toBe(true);
    },
  );

  it.each([
    "442074127000",
    "+44 20 7412 7000",
    "+44-20-7412-7000",
    "(020) 7412 7000",
    "+0442074127000",
    "+4420",
    "+1234567890123456",
    "",
    "tel:+442074127000",
  ])("rejects %j", (value) => {
    expect(isE164Phone(value)).toBe(false);
  });

  it("rejects values that are not strings", () => {
    expect(isE164Phone(442074127000)).toBe(false);
    expect(isE164Phone(null)).toBe(false);
  });
});

describe("isOpeningHours (#356)", () => {
  it("accepts short single-line text", () => {
    expect(isOpeningHours("Mon-Fri 09:00-17:00")).toBe(true);
    expect(isOpeningHours("Open 24 hours")).toBe(true);
  });

  it("rejects blank text, line breaks and anything over 120 characters", () => {
    expect(isOpeningHours("")).toBe(false);
    expect(isOpeningHours("   ")).toBe(false);
    expect(isOpeningHours("Mon-Fri\n9-5")).toBe(false);
    expect(isOpeningHours("x".repeat(121))).toBe(false);
    expect(isOpeningHours("x".repeat(120))).toBe(true);
  });
});

describe("place schema and validator agree on the contact fields (#356)", () => {
  const schema = JSON.parse(
    readFileSync(join(process.cwd(), "data", "places.schema.json"), "utf8"),
  );
  const props = schema.properties;

  it("lists website, phone and hours as optional properties", () => {
    for (const field of ["website", "phone", "hours"]) {
      expect(props[field]).toBeTruthy();
      expect(schema.required).not.toContain(field);
    }
  });

  it("uses a phone pattern that matches the validator on the same samples", () => {
    const re = new RegExp(props.phone.pattern);
    for (const sample of [
      "+442074127000",
      "+14155552671",
      "442074127000",
      "+44 20 7412",
      "",
    ]) {
      expect(re.test(sample)).toBe(isE164Phone(sample));
    }
  });

  it("uses a website pattern that requires https", () => {
    const re = new RegExp(props.website.pattern);
    for (const sample of [
      "https://www.bl.uk",
      "http://www.bl.uk",
      "www.bl.uk",
      "https://with space.com",
    ]) {
      expect(re.test(sample)).toBe(isHttpsUrl(sample) && !/\s/.test(sample));
    }
  });

  it("caps the hours length at the same limit as the validator", () => {
    expect(props.hours.maxLength).toBe(120);
  });
});
