import { describe, expect, it, vi } from "vitest";

import {
  coordinatesFromGoogleMapsUrl,
  isShortGoogleMapsLink,
  resolveShortLink,
} from "../../scripts/lib/gmaps-coordinates.mjs";

describe("coordinatesFromGoogleMapsUrl", () => {
  it("reads the viewport centre from an @lat,lng URL", () => {
    expect(
      coordinatesFromGoogleMapsUrl(
        "https://www.google.com/maps/place/Central+Library/@19.0176,72.8562,17z/data=!4m6",
      ),
    ).toEqual({ lat: 19.0176, lng: 72.8562 });
  });

  it("prefers the pin (!3d!4d) over the viewport centre", () => {
    expect(
      coordinatesFromGoogleMapsUrl(
        "https://www.google.com/maps/place/X/@19.5,72.5,17z/data=!3m1!4b1!4m6!3d19.0176!4d72.8562",
      ),
    ).toEqual({ lat: 19.0176, lng: 72.8562 });
  });

  it.each([
    "https://maps.google.com/?q=19.0176,72.8562",
    "https://www.google.com/maps?ll=19.0176,72.8562",
    "https://www.google.com/maps/search/?api=1&query=19.0176%2C72.8562",
  ])("reads query-parameter forms: %s", (url) => {
    expect(coordinatesFromGoogleMapsUrl(url)).toEqual({ lat: 19.0176, lng: 72.8562 });
  });

  it("handles negative coordinates", () => {
    expect(
      coordinatesFromGoogleMapsUrl("https://maps.google.com/?q=-33.8688,151.2093"),
    ).toEqual({ lat: -33.8688, lng: 151.2093 });
  });

  it("returns null for out-of-range values, short links and junk", () => {
    expect(
      coordinatesFromGoogleMapsUrl("https://maps.google.com/?q=95.1,72.8"),
    ).toBeNull();
    expect(
      coordinatesFromGoogleMapsUrl("https://maps.google.com/?q=19.0,190.5"),
    ).toBeNull();
    expect(coordinatesFromGoogleMapsUrl("https://maps.app.goo.gl/abc123")).toBeNull();
    expect(coordinatesFromGoogleMapsUrl("not a url")).toBeNull();
    expect(coordinatesFromGoogleMapsUrl(undefined as unknown as string)).toBeNull();
  });
});

describe("isShortGoogleMapsLink", () => {
  it("recognises Google's short hosts only", () => {
    expect(isShortGoogleMapsLink("https://maps.app.goo.gl/abc")).toBe(true);
    expect(isShortGoogleMapsLink("https://goo.gl/maps/abc")).toBe(true);
    expect(isShortGoogleMapsLink("https://maps.app.goo.gl/")).toBe(false);
    expect(isShortGoogleMapsLink("https://evil.example/maps/abc")).toBe(false);
    expect(isShortGoogleMapsLink("http://maps.app.goo.gl/abc")).toBe(false);
  });
});

describe("resolveShortLink", () => {
  function redirect(location: string) {
    return { headers: new Headers({ location }) } as unknown as Response;
  }

  it("follows a redirect to the full URL", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        redirect("https://www.google.com/maps/place/X/@19.0176,72.8562,17z"),
      );
    const resolved = await resolveShortLink("https://maps.app.goo.gl/abc", fetchImpl);
    expect(resolved).toBe("https://www.google.com/maps/place/X/@19.0176,72.8562,17z");
    expect(fetchImpl).toHaveBeenCalledWith("https://maps.app.goo.gl/abc", {
      redirect: "manual",
    });
  });

  it("refuses to fetch a host outside the Google allowlist", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(redirect("https://evil.example/x"));
    expect(await resolveShortLink("https://maps.app.goo.gl/abc", fetchImpl)).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("never fetches a non-Google starting URL", async () => {
    const fetchImpl = vi.fn();
    expect(await resolveShortLink("https://evil.example/abc", fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
