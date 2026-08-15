import { describe, expect, it } from "vitest";

import { placeJsonLd, placeJsonLdScript, schemaOrgType } from "@/lib/jsonld";
import { site } from "@/lib/site";
import type { Place } from "@/lib/types";

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: "mum-library-01",
    name: "David Sassoon Library",
    type: "library",
    city: "mumbai",
    lat: 18.9674,
    lng: 72.8339,
    address: "Fort, Mumbai 400001",
    gmaps_link: "https://maps.google.com/?q=18.9674,72.8339",
    added_by: "test",
    ...overrides,
  };
}

describe("schemaOrgType", () => {
  it("maps library, gov_offices and airport to their specific subtypes", () => {
    expect(schemaOrgType("library")).toBe("Library");
    expect(schemaOrgType("gov_offices")).toBe("GovernmentOffice");
    expect(schemaOrgType("airport")).toBe("Airport");
  });

  it("falls back to Place for types without a genuine schema.org match", () => {
    expect(schemaOrgType("sat_centre")).toBe("Place");
    expect(schemaOrgType("foreign_lang_exam_centre")).toBe("Place");
    expect(schemaOrgType("other_places")).toBe("Place");
  });
});

describe("placeJsonLd", () => {
  it("emits name, address, geo and the map deep link", () => {
    expect(placeJsonLd(place())).toEqual({
      "@context": "https://schema.org",
      "@type": "Library",
      name: "David Sassoon Library",
      url: `${site.url}/map?place=mum-library-01`,
      address: "Fort, Mumbai 400001",
      geo: {
        "@type": "GeoCoordinates",
        latitude: 18.9674,
        longitude: 72.8339,
      },
    });
  });

  it("URL-encodes the place id in the deep link", () => {
    const p = place({ id: "navi_mumbai-sat_centre-02" });
    expect(placeJsonLd(p).url).toBe(
      `${site.url}/map?place=navi_mumbai-sat_centre-02`,
    );
  });

  it("uses the specific subtype when the record genuinely is one", () => {
    expect(placeJsonLd(place({ type: "gov_offices" }))["@type"]).toBe(
      "GovernmentOffice",
    );
    expect(placeJsonLd(place({ type: "airport" }))["@type"]).toBe("Airport");
    expect(placeJsonLd(place({ type: "sat_centre" }))["@type"]).toBe("Place");
  });

  it("omits address when the record has none instead of emitting a placeholder", () => {
    const node = placeJsonLd(place({ address: undefined }));
    expect(node).not.toHaveProperty("address");
  });

  it("omits geo when coordinates are missing instead of emitting nulls", () => {
    const withoutLat = ({ ...place(), lat: undefined } as unknown) as Place;
    expect(placeJsonLd(withoutLat)).not.toHaveProperty("geo");
    const withoutLng = ({ ...place(), lng: undefined } as unknown) as Place;
    expect(placeJsonLd(withoutLng)).not.toHaveProperty("geo");
  });

  it("omits geo when a coordinate is not a finite number", () => {
    expect(placeJsonLd(place({ lat: NaN, lng: 72.8339 }))).not.toHaveProperty(
      "geo",
    );
    expect(placeJsonLd(place({ lat: 18.9674, lng: Infinity }))).not.toHaveProperty(
      "geo",
    );
  });

  it("emits only real dataset fields — no invented values", () => {
    const node = placeJsonLd(place());
    expect(Object.keys(node).sort()).toEqual([
      "@context",
      "@type",
      "address",
      "geo",
      "name",
      "url",
    ]);
  });
});

describe("placeJsonLdScript", () => {
  it("serializes the node as JSON", () => {
    const script = placeJsonLdScript(place());
    expect(JSON.parse(script)).toEqual(placeJsonLd(place()));
  });

  it("escapes < so a name can never break out of the script tag", () => {
    const script = placeJsonLdScript(place({ name: "A <b>Library</b>" }));
    expect(script).not.toContain("</");
    expect(script).toContain("\\u003c");
  });
});
