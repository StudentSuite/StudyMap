import { describe, expect, it, vi } from "vitest";

let mockRpc: (name: string, args: unknown) => Promise<{ data: unknown; error: unknown }>;
vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: () =>
    mockRpc
      ? {
          rpc: (name: string, args: unknown) => mockRpc(name, args),
        }
      : null,
}));

import { GET } from "./route";
import { getCompetitions } from "@/lib/competitions";

const VALID_TOKEN = "11111111-1111-1111-1111-111111111111";

function request(path: string): Request {
  return new Request(`http://localhost${path}`);
}

describe("GET /api/competitions/saved.ics (route handler)", () => {
  it("returns 404 when no token is given", async () => {
    mockRpc = () => Promise.resolve({ data: [], error: null });
    const response = await GET(request("/api/competitions/saved.ics"));
    expect(response.status).toBe(404);
  });

  it("returns 404 for a malformed token without ever calling Supabase", async () => {
    let called = false;
    mockRpc = () => {
      called = true;
      return Promise.resolve({ data: [], error: null });
    };
    const response = await GET(
      request("/api/competitions/saved.ics?token=not-a-uuid"),
    );
    expect(response.status).toBe(404);
    expect(called).toBe(false);
  });

  it("returns 404 for a token that matches no user (RPC returns null)", async () => {
    mockRpc = () => Promise.resolve({ data: null, error: null });
    const response = await GET(
      request(`/api/competitions/saved.ics?token=${VALID_TOKEN}`),
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 on any RPC error, never a 500 leaking detail", async () => {
    mockRpc = () =>
      Promise.resolve({ data: null, error: { message: "relation does not exist" } });
    const response = await GET(
      request(`/api/competitions/saved.ics?token=${VALID_TOKEN}`),
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 when Supabase isn't configured (createAnonClient returns null)", async () => {
    mockRpc = undefined as unknown as typeof mockRpc;
    const response = await GET(
      request(`/api/competitions/saved.ics?token=${VALID_TOKEN}`),
    );
    expect(response.status).toBe(404);
  });

  it("returns a valid empty calendar for a valid token with zero saves", async () => {
    mockRpc = () => Promise.resolve({ data: [], error: null });
    const response = await GET(
      request(`/api/competitions/saved.ics?token=${VALID_TOKEN}`),
    );
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).not.toContain("BEGIN:VEVENT");
  });

  it("returns only that token's saved competitions", async () => {
    const all = getCompetitions();
    const saved = all.find((c) => c.dates.length > 0)!;
    const excluded = all.find((c) => c.id !== saved.id && c.dates.length > 0)!;
    mockRpc = () => Promise.resolve({ data: [saved.id], error: null });
    const response = await GET(
      request(`/api/competitions/saved.ics?token=${VALID_TOKEN}`),
    );
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain(`UID:${saved.id}-date-0@studyymap.com`);
    expect(body).not.toContain(`UID:${excluded.id}-date-0@studyymap.com`);
  });

  it("sets calendar content type and a private, no-store cache header", async () => {
    mockRpc = () => Promise.resolve({ data: [], error: null });
    const response = await GET(
      request(`/api/competitions/saved.ics?token=${VALID_TOKEN}`),
    );
    expect(response.headers.get("content-type")).toContain("text/calendar");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("cache-control")).toContain("private");
  });
});
