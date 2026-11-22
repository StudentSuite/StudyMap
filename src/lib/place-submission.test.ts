import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PLACE_TYPES,
  addedByFor,
  buildIssueBody,
  buildPlaceRecord,
  cityIdPrefix,
  findDuplicate,
  inferCountry,
  nextPlaceId,
  normalizeSubmission,
  parseIssueBody,
  slugifyCity,
} from "../../scripts/lib/place-submission.mjs";
import {
  appendRecordText,
  processSubmission,
} from "../../scripts/process-place-submission.mjs";

const valid = {
  name: "Central Library",
  type: "library",
  city: "Navi Mumbai",
  gmapsLink: "https://www.google.com/maps/place/X/@19.033,73.0297,17z",
  contributor: "Asha",
  note: "Open to students",
};

const records = [
  {
    id: "mum-library-01",
    name: "David Sassoon Library",
    type: "library",
    city: "mumbai",
    country: "IN",
  },
  {
    id: "mum-library-02",
    name: "JN Petit Library",
    type: "library",
    city: "mumbai",
    country: "IN",
  },
  {
    id: "mumbai-sat-01",
    name: "Some SAT Centre",
    type: "sat_centre",
    city: "mumbai",
    country: "IN",
  },
  {
    id: "mum-airport-terminal-01",
    name: "T1",
    type: "airport",
    city: "mumbai",
    country: "IN",
  },
  {
    id: "delhi-ncr-other_places-01",
    name: "Cafe",
    type: "other_places",
    city: "new_delhi",
    country: "IN",
  },
];

function submission(input: unknown = valid) {
  const result = normalizeSubmission(input) as unknown as {
    ok: boolean;
    value: Parameters<typeof buildIssueBody>[0];
  };
  if (!result.ok) throw new Error("expected a valid submission");
  return result.value;
}

describe("place type list", () => {
  it("matches the place schema's type enum", () => {
    const schema = JSON.parse(
      readFileSync(resolve(process.cwd(), "data/places.schema.json"), "utf8"),
    );
    expect([...PLACE_TYPES].sort()).toEqual([...schema.properties.type.enum].sort());
  });
});

describe("slugifyCity", () => {
  it("makes lowercase underscore slugs and folds diacritics", () => {
    expect(slugifyCity("Navi Mumbai")).toBe("navi_mumbai");
    expect(slugifyCity("  São Paulo! ")).toBe("sao_paulo");
    expect(slugifyCity("!!!")).toBe("");
  });
});

describe("normalizeSubmission", () => {
  it("accepts a valid submission and slugs the city", () => {
    const result = normalizeSubmission(valid);
    expect(result).toMatchObject({
      ok: true,
      value: { city: "navi_mumbai", name: "Central Library" },
    });
  });

  it.each([
    [{ ...valid, name: "  " }, "Place name"],
    [{ ...valid, type: "cafe" }, "place type"],
    [{ ...valid, city: "" }, "City"],
    [{ ...valid, gmapsLink: "https://evil.example/maps" }, "Google Maps"],
    [{ ...valid, gmapsLink: "http://maps.google.com/?q=1,2" }, "Google Maps"],
    [null, "object"],
  ])("rejects %j", (input, message) => {
    const result = normalizeSubmission(input);
    expect(result.ok).toBe(false);
    expect((result as { error: string }).error).toContain(message);
  });

  it("strips backticks and em dashes, collapses whitespace, caps length", () => {
    const result = normalizeSubmission({
      ...valid,
      name: "A `quoted`\n place — here",
      note: "x".repeat(900),
    });
    expect(result.ok).toBe(true);
    const value = (result as { value: { name: string; note: string } }).value;
    expect(value.name).toBe("A 'quoted' place - here");
    expect(value.note).toHaveLength(500);
  });
});

describe("issue body round trip", () => {
  it("parses back exactly what it wrote", () => {
    const sub = submission();
    expect(parseIssueBody(buildIssueBody(sub))).toEqual(sub);
  });

  it("cannot be broken out of the fence by a note", () => {
    const sub = submission({ ...valid, note: "``` injected ```" });
    expect(parseIssueBody(buildIssueBody(sub))).toEqual(sub);
  });

  it("rejects bodies without the marker, with bad JSON, or with invalid fields", () => {
    expect(parseIssueBody("just text")).toBeNull();
    expect(parseIssueBody(undefined as unknown as string)).toBeNull();
    const sub = submission();
    const body = buildIssueBody(sub);
    expect(
      parseIssueBody(body.replace(/```json[\s\S]*$/, "```json\n{nope\n```")),
    ).toBeNull();
    expect(parseIssueBody(body.replace('"library"', '"spaceport"'))).toBeNull();
  });
});

describe("ids and country", () => {
  it("continues the city's own prefix and numbering", () => {
    expect(nextPlaceId(records, "mumbai", "library")).toBe("mum-library-03");
  });

  it("uses a per-type prefix and the sat segment for SAT centres", () => {
    expect(cityIdPrefix(records, "mumbai", "sat_centre")).toBe("mumbai");
    expect(nextPlaceId(records, "mumbai", "sat_centre")).toBe("mumbai-sat-02");
  });

  it("starts at 01 and does not trip on multi-segment ids", () => {
    expect(nextPlaceId(records, "mumbai", "gov_offices")).toBe("mum-gov_offices-01");
    expect(nextPlaceId(records, "mumbai", "airport")).toBe("mum-airport-01");
    expect(nextPlaceId(records, "new_delhi", "other_places")).toBe(
      "delhi-ncr-other_places-02",
    );
  });

  it("falls back to three letters of the slug for a new city", () => {
    expect(nextPlaceId(records, "lisbon", "library")).toBe("lis-library-01");
  });

  it("infers the country from the city and returns null for a new city", () => {
    expect(inferCountry(records, "mumbai")).toBe("IN");
    expect(inferCountry(records, "lisbon")).toBeNull();
  });

  it("finds a same-name duplicate despite case and punctuation", () => {
    expect(findDuplicate(records, "mumbai", "david sassoon library!")?.id).toBe(
      "mum-library-01",
    );
    expect(findDuplicate(records, "pune", "David Sassoon Library")).toBeNull();
  });
});

describe("buildPlaceRecord", () => {
  it("emits exactly the schema fields with a ?q= link matching the coordinates", () => {
    const sub = submission();
    expect(
      buildPlaceRecord({
        sub,
        coords: { lat: 19.033, lng: 73.0297 },
        country: "IN",
        id: "nvm-library-01",
      }),
    ).toEqual({
      id: "nvm-library-01",
      name: "Central Library",
      type: "library",
      city: "navi_mumbai",
      country: "IN",
      lat: 19.033,
      lng: 73.0297,
      gmaps_link: "https://maps.google.com/?q=19.033,73.0297",
      added_by: "Asha",
    });
  });

  it("makes a handle-shaped added_by, or falls back to community", () => {
    expect(addedByFor("Anay Dhawan")).toBe("Anay-Dhawan");
    expect(addedByFor("Ünal <script>")).toBe("Unal-script");
    expect(addedByFor("")).toBe("community");
    expect(addedByFor("!!!")).toBe("community");
  });
});

describe("processSubmission", () => {
  const body = (over = {}) =>
    buildIssueBody(submission({ ...valid, city: "mumbai", ...over }));

  it("returns a ready record for a good submission", async () => {
    const result = await processSubmission({ body: body(), records });
    expect(result.status).toBe("ready");
    expect(result.record).toMatchObject({
      id: "mum-library-03",
      city: "mumbai",
      country: "IN",
      lat: 19.033,
      lng: 73.0297,
    });
  });

  it("resolves a short link through the injected resolver", async () => {
    const result = await processSubmission({
      body: body({ gmapsLink: "https://maps.app.goo.gl/abc123" }),
      records,
      resolve: async () => "https://www.google.com/maps/place/X/@18.9,72.8,17z",
    });
    expect(result.status).toBe("ready");
    expect(result.record).toMatchObject({ lat: 18.9, lng: 72.8 });
  });

  it("asks for help when the short link cannot be resolved", async () => {
    const result = await processSubmission({
      body: body({ gmapsLink: "https://maps.app.goo.gl/abc123" }),
      records,
      resolve: async () => null,
    });
    expect(result.status).toBe("needs-info");
  });

  it("flags duplicates, new cities with no country, and junk bodies", async () => {
    expect(
      (
        await processSubmission({
          body: body({ name: "David Sassoon Library" }),
          records,
        })
      ).status,
    ).toBe("duplicate");
    expect(
      (await processSubmission({ body: body({ city: "Lisbon" }), records })).status,
    ).toBe("needs-info");
    expect((await processSubmission({ body: "hello", records })).status).toBe("rejected");
  });
});

describe("appendRecordText", () => {
  const record = { id: "x-library-01", name: "New", type: "library" };

  it("adds one entry and leaves the existing text byte for byte alone", () => {
    const existing = '[\n  {\n    "id": "a",\n    "name": "\u53a6"\n  }\n]\n';
    const next = appendRecordText(existing, record);
    expect(next.startsWith(existing.replace(/\n\]\n$/, ""))).toBe(true);
    expect(JSON.parse(next)).toHaveLength(2);
    expect(next.endsWith("  }\n]\n")).toBe(true);
  });

  it("handles an empty array", () => {
    expect(JSON.parse(appendRecordText("[]\n", record))).toEqual([record]);
  });
});
