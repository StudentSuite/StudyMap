import { describe, expect, it } from "vitest";

import {
  competitionJsonLd,
  competitionJsonLdScript,
  placeJsonLd,
  placeJsonLdScript,
  schemaOrgCompetitionType,
  schemaOrgType,
} from "@/lib/jsonld";
import { site } from "@/lib/site";
import type { Competition } from "@/lib/types";
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
    expect(placeJsonLd(p).url).toBe(`${site.url}/map?place=navi_mumbai-sat_centre-02`);
  });

  it("uses the specific subtype when the record genuinely is one", () => {
    expect(placeJsonLd(place({ type: "gov_offices" }))["@type"]).toBe("GovernmentOffice");
    expect(placeJsonLd(place({ type: "airport" }))["@type"]).toBe("Airport");
    expect(placeJsonLd(place({ type: "sat_centre" }))["@type"]).toBe("Place");
  });

  it("omits address when the record has none instead of emitting a placeholder", () => {
    const node = placeJsonLd(place({ address: undefined }));
    expect(node).not.toHaveProperty("address");
  });

  it("omits geo when coordinates are missing instead of emitting nulls", () => {
    const withoutLat = { ...place(), lat: undefined } as unknown as Place;
    expect(placeJsonLd(withoutLat)).not.toHaveProperty("geo");
    const withoutLng = { ...place(), lng: undefined } as unknown as Place;
    expect(placeJsonLd(withoutLng)).not.toHaveProperty("geo");
  });

  it("omits geo when a coordinate is not a finite number", () => {
    expect(placeJsonLd(place({ lat: NaN, lng: 72.8339 }))).not.toHaveProperty("geo");
    expect(placeJsonLd(place({ lat: 18.9674, lng: Infinity }))).not.toHaveProperty("geo");
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

function competition(overrides: Partial<Competition> = {}): Competition {
  return {
    id: "breakthrough-junior-challenge",
    name: "Breakthrough Junior Challenge",
    organizer: "Breakthrough Prize Foundation",
    organizer_url: "https://breakthroughjuniorchallenge.org",
    category: "stem",
    subjects: ["physics"],
    description: "A science communication video competition.",
    format: "online",
    age_min: 13,
    age_max: 18,
    participation: "individual",
    region: "international",
    fee: { amount: 0, currency: "USD" },
    prize: "USD 250,000 scholarship",
    official_url: "https://breakthroughjuniorchallenge.org",
    cycle_year: 2027,
    dates: [
      {
        label: "Submission deadline",
        date: "2027-06-25",
        type: "deadline",
        timezone: "UTC-4",
        estimated: false,
        source_url: "https://breakthroughjuniorchallenge.org/rules",
      },
      {
        label: "Results",
        date: "2027-11-01",
        type: "results",
        timezone: "UTC-4",
        estimated: true,
        source_url: "https://breakthroughjuniorchallenge.org/rules",
      },
    ],
    added_by: "test",
    ...overrides,
  };
}

describe("schemaOrgCompetitionType", () => {
  it("maps scholarship to EducationalOccupationalProgram", () => {
    expect(schemaOrgCompetitionType("scholarship")).toBe(
      "EducationalOccupationalProgram",
    );
  });

  it("maps every other category to Event", () => {
    expect(schemaOrgCompetitionType("stem")).toBe("Event");
    expect(schemaOrgCompetitionType("mathematics")).toBe("Event");
    expect(schemaOrgCompetitionType("coding")).toBe("Event");
  });
});

describe("competitionJsonLd", () => {
  it("emits name, description, url, organizer, attendance mode and free-entry flag", () => {
    const node = competitionJsonLd(competition());
    expect(node).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Breakthrough Junior Challenge",
      description: "A science communication video competition.",
      url: `${site.url}/competitions/breakthrough-junior-challenge`,
      organizer: {
        "@type": "Organization",
        name: "Breakthrough Prize Foundation",
        url: "https://breakthroughjuniorchallenge.org",
      },
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      isAccessibleForFree: true,
    });
  });

  it("uses EducationalOccupationalProgram for a scholarship", () => {
    expect(competitionJsonLd(competition({ category: "scholarship" }))["@type"]).toBe(
      "EducationalOccupationalProgram",
    );
  });

  it("maps in_person and hybrid formats to their own attendance mode", () => {
    expect(
      competitionJsonLd(competition({ format: "in_person" })).eventAttendanceMode,
    ).toBe("https://schema.org/OfflineEventAttendanceMode");
    expect(competitionJsonLd(competition({ format: "hybrid" })).eventAttendanceMode).toBe(
      "https://schema.org/MixedEventAttendanceMode",
    );
  });

  it("isAccessibleForFree is false once there's a real fee", () => {
    expect(
      competitionJsonLd(competition({ fee: { amount: 25, currency: "USD" } }))
        .isAccessibleForFree,
    ).toBe(false);
  });

  it("startDate/endDate only ever come from estimated: false dates", () => {
    // The fixture has one confirmed date (2027-06-25) and one estimated
    // date (2027-11-01, later) - only the confirmed one may surface.
    const node = competitionJsonLd(competition());
    expect(node.startDate).toBe("2027-06-25");
    expect(node.endDate).toBe("2027-06-25");
  });

  it("spans startDate to endDate across multiple confirmed dates", () => {
    const node = competitionJsonLd(
      competition({
        dates: [
          {
            label: "Registration opens",
            date: "2027-01-01",
            type: "registration_open",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com",
          },
          {
            label: "Ceremony",
            date: "2027-08-01",
            type: "ceremony",
            timezone: "UTC",
            estimated: false,
            source_url: "https://example.com",
          },
        ],
      }),
    );
    expect(node.startDate).toBe("2027-01-01");
    expect(node.endDate).toBe("2027-08-01");
  });

  it("omits startDate/endDate entirely when every date is still estimated", () => {
    const node = competitionJsonLd(
      competition({
        dates: [
          {
            label: "Results",
            date: "2027-11-01",
            type: "results",
            timezone: "UTC",
            estimated: true,
            source_url: "https://example.com",
          },
        ],
      }),
    );
    expect(node).not.toHaveProperty("startDate");
    expect(node).not.toHaveProperty("endDate");
  });
});

describe("competitionJsonLdScript", () => {
  it("serializes the node as JSON", () => {
    const script = competitionJsonLdScript(competition());
    expect(JSON.parse(script)).toEqual(competitionJsonLd(competition()));
  });

  it("escapes < so a description can never break out of the script tag", () => {
    const script = competitionJsonLdScript(
      competition({ description: "A <script>alert(1)</script> competition" }),
    );
    expect(script).not.toContain("</");
    expect(script).toContain("\\u003c");
  });
});
