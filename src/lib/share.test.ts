import { describe, expect, it } from "vitest";

import { buildShareUrl, mapStateToSearch, parseMapState, type MapShareState } from "@/lib/share";

const emptyState: MapShareState = {
  types: [],
  city: null,
  placeId: null,
  lat: null,
  lng: null,
  zoom: null,
};

describe("mapStateToSearch / parseMapState round-trip", () => {
  it("round-trips a fully populated state", () => {
    const state: MapShareState = {
      types: ["library", "sat_centre"],
      city: "mumbai",
      placeId: "mum-library-01",
      lat: 19.076,
      lng: 72.8777,
      zoom: 14,
    };
    const search = mapStateToSearch(state);
    expect(parseMapState(search)).toEqual(state);
  });

  it("round-trips an empty state as an empty query string", () => {
    expect(mapStateToSearch(emptyState)).toBe("");
    expect(parseMapState("")).toEqual(emptyState);
  });

  it("drops unknown place types when parsing", () => {
    const parsed = parseMapState("?types=library,not_a_real_type");
    expect(parsed.types).toEqual(["library"]);
  });

  it("treats a blank city as unset", () => {
    expect(parseMapState("?city=").city).toBeNull();
  });

  it("reads a placeId with no other state set", () => {
    const search = mapStateToSearch({
      ...emptyState,
      placeId: "mum-library-01",
    });
    expect(search).toBe("?place=mum-library-01");
    expect(parseMapState(search).placeId).toBe("mum-library-01");
  });

  it("round-trips a viewport without filters", () => {
    const search = mapStateToSearch({
      ...emptyState,
      lat: 19.076,
      lng: 72.8777,
      zoom: 12,
    });
    expect(search).toBe("?lat=19.076&lng=72.8777&zoom=12");
    expect(parseMapState(search)).toEqual({
      ...emptyState,
      lat: 19.076,
      lng: 72.8777,
      zoom: 12,
    });
  });

  it("ignores lat/lng unless both are present and finite", () => {
    const parsed = parseMapState("?lat=19.076&zoom=12");
    expect(parsed.lat).toBeNull();
    expect(parsed.lng).toBeNull();
    expect(parsed.zoom).toBeNull();

    const bogus = parseMapState("?lat=abc&lng=72.8777");
    expect(bogus.lat).toBeNull();
    expect(bogus.lng).toBeNull();
  });

  it("rejects out-of-range viewport coordinates and zoom", () => {
    expect(parseMapState("?lat=90&lng=180&zoom=20")).toMatchObject({
      lat: 90,
      lng: 180,
      zoom: 20,
    });

    expect(parseMapState("?lat=91&lng=180&zoom=20")).toMatchObject({
      lat: null,
      lng: null,
      zoom: null,
    });
    expect(parseMapState("?lat=-90&lng=-181&zoom=20")).toMatchObject({
      lat: null,
      lng: null,
      zoom: null,
    });
    expect(parseMapState("?lat=0&lng=0&zoom=21")).toMatchObject({
      lat: 0,
      lng: 0,
      zoom: null,
    });
  });

  it("omits the zoom when it is null", () => {
    const search = mapStateToSearch({ ...emptyState, lat: 19.076, lng: 72.8777 });
    expect(search).toBe("?lat=19.076&lng=72.8777");
  });
});

describe("buildShareUrl", () => {
  it("builds an absolute URL from the current origin and pathname", () => {
    const url = buildShareUrl({
      ...emptyState,
      types: ["library"],
      city: "mumbai",
    });
    expect(url).toBe(`${window.location.origin}${window.location.pathname}?types=library&city=mumbai`);
  });

  it("includes the viewport when present", () => {
    const url = buildShareUrl({
      ...emptyState,
      placeId: "mum-library-01",
      lat: 19.076,
      lng: 72.8777,
      zoom: 15,
    });
    expect(url).toBe(
      `${window.location.origin}${window.location.pathname}?place=mum-library-01&lat=19.076&lng=72.8777&zoom=15`,
    );
  });

  it("returns just the origin and pathname when no state is set", () => {
    const url = buildShareUrl(emptyState);
    expect(url).toBe(`${window.location.origin}${window.location.pathname}`);
  });
});
