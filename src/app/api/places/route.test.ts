import { describe, expect, it } from "vitest";

import { PLACES_API_LIMITS } from "@/lib/places-api";
import { GET } from "./route";

function request(path: string): Request {
  return new Request(`http://localhost${path}`);
}

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("GET /api/places (route handler)", () => {
  it("returns the dataset with the default limit", async () => {
    const response = await GET(request("/api/places"));
    expect(response.status).toBe(200);
    const body = await json(response);
    const data = body.data as unknown[];
    expect(body.total).toBeGreaterThan(0);
    expect(data.length).toBe(100); // default limit
  });

  it("applies the city filter case-insensitively (issue verification example)", async () => {
    const response = await GET(request("/api/places?city=Mumbai&limit=5"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect(body.limit).toBe(5);
    expect((body.data as { city: string }[]).every((p) => p.city === "mumbai")).toBe(
      true,
    );
  });

  it("clamps a huge limit instead of dumping everything", async () => {
    const response = await GET(request("/api/places?limit=999999"));
    const body = await json(response);
    expect(body.limit).toBe(500);
    // The dataset now exceeds the 500-row pagination cap, so the response is
    // a first page of 500 rows rather than the full dataset.
    expect((body.data as unknown[]).length).toBe(PLACES_API_LIMITS.maxLimit);
    expect(body.total).toBeGreaterThan(PLACES_API_LIMITS.maxLimit);
  });

  it("filters by category", async () => {
    const response = await GET(request("/api/places?category=airport"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect((body.data as { type: string }[]).every((p) => p.type === "airport")).toBe(
      true,
    );
  });

  it("returns 400 for an unknown category", async () => {
    const response = await GET(request("/api/places?category=bookshop"));
    expect(response.status).toBe(400);
    const body = await json(response);
    expect(body.error).toContain("bookshop");
  });

  it("returns 400 for a country filter (dataset has no country field)", async () => {
    const response = await GET(request("/api/places?country=India"));
    expect(response.status).toBe(400);
    const body = await json(response);
    expect(String(body.error)).toContain("country");
  });

  it("returns 400 for a malformed limit", async () => {
    const response = await GET(request("/api/places?limit=abc"));
    expect(response.status).toBe(400);
  });

  it("sends permissive CORS and cache headers on every response", async () => {
    const ok = await GET(request("/api/places?limit=5"));
    expect(ok.headers.get("access-control-allow-origin")).toBe("*");
    expect(ok.headers.get("cache-control")).toContain("public");

    const bad = await GET(request("/api/places?category=bookshop"));
    expect(bad.headers.get("access-control-allow-origin")).toBe("*");
    expect(bad.headers.get("cache-control")).toContain("public");
  });
});
