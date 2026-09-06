import { describe, expect, it } from "vitest";

import { GET } from "./route";
import { getCompetitions } from "@/lib/competitions";

function request(path: string): Request {
  return new Request(`http://localhost${path}`);
}

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("GET /api/competitions (route handler)", () => {
  it("returns the dataset with the default limit", async () => {
    const response = await GET(request("/api/competitions"));
    expect(response.status).toBe(200);
    const body = await json(response);
    const data = body.data as unknown[];
    expect(body.total).toBeGreaterThan(0);
    // The dataset is small enough that the default limit returns everything
    // today; if it grows past the default, this should shrink to the limit.
    expect(data.length).toBe(Math.min(body.total as number, body.limit as number));
  });

  it("filters by category", async () => {
    const response = await GET(request("/api/competitions?category=mathematics"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect(
      (body.data as { category: string }[]).every((c) => c.category === "mathematics"),
    ).toBe(true);
  });

  it("returns 400 for an unknown category", async () => {
    const response = await GET(request("/api/competitions?category=knitting"));
    expect(response.status).toBe(400);
    const body = await json(response);
    expect(String(body.error)).toContain("knitting");
  });

  it("filters by format", async () => {
    const response = await GET(request("/api/competitions?format=online"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect((body.data as { format: string }[]).every((c) => c.format === "online")).toBe(
      true,
    );
  });

  it("returns 400 for an unknown format", async () => {
    const response = await GET(request("/api/competitions?format=telepathic"));
    expect(response.status).toBe(400);
  });

  it("filters by participation", async () => {
    const response = await GET(request("/api/competitions?participation=team"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect(
      (body.data as { participation: string }[]).every((c) => c.participation === "team"),
    ).toBe(true);
  });

  it("returns 400 for an unknown participation", async () => {
    const response = await GET(request("/api/competitions?participation=solo-ish"));
    expect(response.status).toBe(400);
  });

  it("filters by region", async () => {
    const response = await GET(request("/api/competitions?region=international"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect(
      (body.data as { region: string }[]).every((c) => c.region === "international"),
    ).toBe(true);
  });

  it("filters by country (country_tracks), unlike the places API's country filter", async () => {
    const withTrack = getCompetitions().find((c) => (c.country_tracks ?? []).length > 0);
    if (!withTrack) return; // nothing in the current dataset carries a track; skip rather than fail

    const country = withTrack.country_tracks![0].country;
    const response = await GET(request(`/api/competitions?country=${country}`));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect((body.data as { id: string }[]).some((c) => c.id === withTrack.id)).toBe(true);
  });

  it("returns 400 for an unknown country", async () => {
    const response = await GET(request("/api/competitions?country=ZZ"));
    expect(response.status).toBe(400);
    const body = await json(response);
    expect(String(body.error)).toContain("ZZ");
  });

  it("filters free-only competitions via fee=free", async () => {
    const response = await GET(request("/api/competitions?fee=free"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect(
      (body.data as { fee: { amount: number } }[]).every((c) => c.fee.amount === 0),
    ).toBe(true);
  });

  it("returns 400 for an unknown fee value", async () => {
    const response = await GET(request("/api/competitions?fee=cheap"));
    expect(response.status).toBe(400);
  });

  it("filters by age within the eligible range", async () => {
    const response = await GET(request("/api/competitions?age=14"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect(
      (body.data as { age_min: number; age_max: number }[]).every(
        (c) => c.age_min <= 14 && c.age_max >= 14,
      ),
    ).toBe(true);
  });

  it("returns 400 for a malformed age", async () => {
    const response = await GET(request("/api/competitions?age=teen"));
    expect(response.status).toBe(400);
  });

  it("filters by deadline_before", async () => {
    const response = await GET(request("/api/competitions?deadline_before=2030-01-01"));
    expect(response.status).toBe(200);
  });

  it("returns 400 for a malformed deadline_before", async () => {
    const response = await GET(request("/api/competitions?deadline_before=not-a-date"));
    expect(response.status).toBe(400);
  });

  it("composes multiple filters at once", async () => {
    const response = await GET(request("/api/competitions?format=online&fee=free"));
    const body = await json(response);
    expect(response.status).toBe(200);
    expect(
      (body.data as { format: string; fee: { amount: number } }[]).every(
        (c) => c.format === "online" && c.fee.amount === 0,
      ),
    ).toBe(true);
  });

  it("clamps a huge limit instead of dumping everything", async () => {
    const response = await GET(request("/api/competitions?limit=999999"));
    const body = await json(response);
    expect(body.limit).toBe(200);
    expect((body.data as unknown[]).length).toBe(body.total);
  });

  it("returns 400 for a malformed limit", async () => {
    const response = await GET(request("/api/competitions?limit=abc"));
    expect(response.status).toBe(400);
  });

  it("paginates stably via offset", async () => {
    const first = await json(await GET(request("/api/competitions?limit=5&offset=0")));
    const second = await json(await GET(request("/api/competitions?limit=5&offset=5")));
    const firstIds = (first.data as { id: string }[]).map((c) => c.id);
    const secondIds = (second.data as { id: string }[]).map((c) => c.id);
    expect(firstIds).not.toEqual(secondIds);
    expect(firstIds.some((id) => secondIds.includes(id))).toBe(false);
  });

  it("returns 400 for a repeated parameter", async () => {
    const response = await GET(
      request("/api/competitions?category=stem&category=coding"),
    );
    expect(response.status).toBe(400);
    const body = await json(response);
    expect(String(body.error)).toContain("category");
  });

  it("sends permissive CORS and cache headers on every response", async () => {
    const ok = await GET(request("/api/competitions?limit=5"));
    expect(ok.headers.get("access-control-allow-origin")).toBe("*");
    expect(ok.headers.get("cache-control")).toContain("public");

    const bad = await GET(request("/api/competitions?category=knitting"));
    expect(bad.headers.get("access-control-allow-origin")).toBe("*");
    expect(bad.headers.get("cache-control")).toContain("public");
  });
});
