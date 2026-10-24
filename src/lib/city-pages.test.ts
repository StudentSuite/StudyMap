import { describe, expect, it } from "vitest";

import {
  cityMetaDescription,
  cityPages,
  cityPageSlugs,
  cityToSlug,
  placesByType,
} from "@/lib/city-pages";
import type { Place } from "@/lib/types";

function place(id: string, city: string, type: Place["type"] = "library"): Place {
  return {
    id,
    name: id,
    type,
    city,
    lat: 19.076,
    lng: 72.8777,
    gmaps_link: "https://maps.google.com/?q=19.076,72.8777",
    added_by: "test",
  };
}

describe("cityToSlug", () => {
  it("leaves canonical underscore slugs unchanged", () => {
    expect(cityToSlug("navi_mumbai")).toBe("navi_mumbai");
    expect(cityToSlug("new_delhi")).toBe("new_delhi");
  });

  it("normalizes spaces, hyphens and case", () => {
    expect(cityToSlug("New Delhi")).toBe("new_delhi");
    expect(cityToSlug("San Jose")).toBe("san_jose");
    expect(cityToSlug("Navi-Mumbai")).toBe("navi_mumbai");
  });

  it("preserves non-ASCII letters instead of collapsing to an empty slug", () => {
    expect(cityToSlug("厦门")).toBe("厦门");
    expect(cityToSlug("São Paulo")).toBe("são_paulo");
  });
});

describe("cityPages", () => {
  it("groups places by city", () => {
    const pages = cityPages([
      place("mum-library-01", "mumbai"),
      place("mum-library-02", "mumbai"),
      place("del-library-01", "new_delhi"),
    ]);
    expect(pages).toHaveLength(2);
    const mumbai = pages.find((page) => page.city === "mumbai");
    expect(mumbai?.places).toHaveLength(2);
    expect(mumbai?.slug).toBe("mumbai");
  });

  it("throws loudly when two distinct cities collide after slugification", () => {
    expect(() =>
      cityPages([place("a-01", "san_jose"), place("b-01", "San Jose")]),
    ).toThrow(/slug collision/i);
  });

  it("does not throw for repeated entries of the same city", () => {
    expect(() =>
      cityPages([place("a-01", "mumbai"), place("a-02", "mumbai")]),
    ).not.toThrow();
  });
});

describe("cityPageSlugs", () => {
  it("returns one param per distinct city", () => {
    const slugs = cityPageSlugs([
      place("mum-library-01", "mumbai"),
      place("del-library-01", "new_delhi"),
    ]);
    expect(slugs).toEqual([{ slug: "mumbai" }, { slug: "new_delhi" }]);
  });
});

describe("placesByType", () => {
  it("groups by type in canonical order and skips empty types", () => {
    const grouped = placesByType([
      place("a-01", "mumbai", "sat_centre"),
      place("a-02", "mumbai", "library"),
      place("a-03", "mumbai", "sat_centre"),
    ]);
    expect(grouped.map(([type]) => type)).toEqual(["library", "sat_centre"]);
    expect(grouped[0][1]).toHaveLength(1);
    expect(grouped[1][1]).toHaveLength(2);
  });
});

describe("cityMetaDescription", () => {
  it("describes a one-library city without calling anything an exam centre", () => {
    const text = cityMetaDescription("Stahnsdorf", [place("a", "stahnsdorf", "library")]);
    expect(text).toBe(
      "Student-important places in Stahnsdorf: 1 library, on the crowdsourced StudyMap.",
    );
    expect(text).not.toContain("exam centre");
  });

  it("reads correctly in the plural for a single type", () => {
    const text = cityMetaDescription("Thane", [
      place("a", "thane", "library"),
      place("b", "thane", "library"),
    ]);
    expect(text).toContain("2 libraries");
    expect(text).not.toContain("library,");
  });

  it("lists a count for every type present and the counts add up to the total", () => {
    const places = [
      ...Array.from({ length: 33 }, (_, i) => place(`s${i}`, "istanbul", "sat_centre")),
      place("f", "istanbul", "foreign_lang_exam_centre"),
      place("g1", "istanbul", "gov_offices"),
      place("g2", "istanbul", "gov_offices"),
      place("l1", "istanbul", "library"),
      place("l2", "istanbul", "library"),
      place("o", "istanbul", "other_places"),
      place("a1", "istanbul", "airport"),
      place("a2", "istanbul", "airport"),
    ];
    expect(places).toHaveLength(41);
    const text = cityMetaDescription("Istanbul", places);
    expect(text).toContain("41 places");
    expect(text).toContain("33 SAT centres");
    expect(text).toContain("1 foreign language exam centre");
    expect(text).toContain("2 government offices");
    expect(text).toContain("2 libraries");
    expect(text).toContain("1 other place");
    expect(text).toContain("2 airports");
    const counts = [
      ...text.matchAll(/(\d+) (?:SAT|foreign|government|librar|other|airport)/g),
    ].map((m) => Number(m[1]));
    expect(counts.reduce((a, b) => a + b, 0)).toBe(41);
  });

  it("mentions only the types the city has", () => {
    const text = cityMetaDescription("Pune", [
      place("a", "pune", "sat_centre"),
      place("b", "pune", "airport"),
    ]);
    expect(text).toContain("2 places");
    expect(text).toContain("1 airport and 1 SAT centre");
    expect(text).not.toContain("librar");
  });
});
