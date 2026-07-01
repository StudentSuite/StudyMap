import { describe, expect, it } from "vitest";

import { buildShareUrl, mapStateToSearch, parseMapState, type MapShareState } from "@/lib/share";

describe("mapStateToSearch / parseMapState round-trip", () => {
  it("round-trips a fully populated state", () => {
    const state: MapShareState = {
      types: ["library", "book_shop"],
      city: "mumbai",
      placeId: "mum-library-01",
    };
    const search = mapStateToSearch(state);
    expect(parseMapState(search)).toEqual(state);
  });

  it("round-trips an empty state as an empty query string", () => {
    const state: MapShareState = { types: [], city: null, placeId: null };
    expect(mapStateToSearch(state)).toBe("");
    expect(parseMapState("")).toEqual(state);
  });

  it("drops unknown place types when parsing", () => {
    const parsed = parseMapState("?types=library,not_a_real_type");
    expect(parsed.types).toEqual(["library"]);
  });

  it("treats a blank city as unset", () => {
    expect(parseMapState("?city=").city).toBeNull();
  });

  it("reads a placeId with no other state set", () => {
    const search = mapStateToSearch({ types: [], city: null, placeId: "mum-library-01" });
    expect(search).toBe("?place=mum-library-01");
    expect(parseMapState(search).placeId).toBe("mum-library-01");
  });
});

describe("buildShareUrl", () => {
  it("builds an absolute URL from the current origin and pathname", () => {
    const url = buildShareUrl({ types: ["library"], city: "mumbai", placeId: null });
    expect(url).toBe(`${window.location.origin}${window.location.pathname}?types=library&city=mumbai`);
  });

  it("returns just the origin and pathname when no state is set", () => {
    const url = buildShareUrl({ types: [], city: null, placeId: null });
    expect(url).toBe(`${window.location.origin}${window.location.pathname}`);
  });
});
