import { describe, expect, it, vi } from "vitest";

let mockClient: unknown = null;
vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: () => mockClient,
}));

import { savedCompetitionIdsForCalendarToken } from "@/lib/calendar-feed";

const VALID_TOKEN = "11111111-1111-1111-1111-111111111111";

describe("savedCompetitionIdsForCalendarToken", () => {
  it("returns null for a non-uuid token without calling Supabase at all", async () => {
    let called = false;
    mockClient = {
      rpc: () => {
        called = true;
        return Promise.resolve({ data: [], error: null });
      },
    };
    expect(await savedCompetitionIdsForCalendarToken("not-a-uuid")).toBeNull();
    expect(called).toBe(false);
  });

  it("is case-insensitive about the uuid's hex digits", async () => {
    mockClient = { rpc: () => Promise.resolve({ data: [], error: null }) };
    expect(
      await savedCompetitionIdsForCalendarToken(VALID_TOKEN.toUpperCase()),
    ).toEqual([]);
  });

  it("returns null when Supabase is not configured", async () => {
    mockClient = null;
    expect(await savedCompetitionIdsForCalendarToken(VALID_TOKEN)).toBeNull();
  });

  it("returns null when the RPC itself errors", async () => {
    mockClient = {
      rpc: () => Promise.resolve({ data: null, error: { message: "boom" } }),
    };
    expect(await savedCompetitionIdsForCalendarToken(VALID_TOKEN)).toBeNull();
  });

  it("returns null when the RPC reports the token doesn't exist (data: null, no error)", async () => {
    mockClient = { rpc: () => Promise.resolve({ data: null, error: null }) };
    expect(await savedCompetitionIdsForCalendarToken(VALID_TOKEN)).toBeNull();
  });

  it("returns an empty array for a valid token with zero saves, distinct from null", async () => {
    mockClient = { rpc: () => Promise.resolve({ data: [], error: null }) };
    expect(await savedCompetitionIdsForCalendarToken(VALID_TOKEN)).toEqual([]);
  });

  it("returns the saved competition ids for a valid token", async () => {
    mockClient = {
      rpc: () => Promise.resolve({ data: ["comp-a", "comp-b"], error: null }),
    };
    expect(await savedCompetitionIdsForCalendarToken(VALID_TOKEN)).toEqual([
      "comp-a",
      "comp-b",
    ]);
  });

  it("passes the token through to the RPC as p_token", async () => {
    let receivedArgs: unknown;
    mockClient = {
      rpc: (_name: string, args: unknown) => {
        receivedArgs = args;
        return Promise.resolve({ data: [], error: null });
      },
    };
    await savedCompetitionIdsForCalendarToken(VALID_TOKEN);
    expect(receivedArgs).toEqual({ p_token: VALID_TOKEN });
  });
});
