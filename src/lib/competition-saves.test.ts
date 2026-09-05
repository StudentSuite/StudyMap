import { describe, expect, it, vi } from "vitest";

let mockClient: unknown = null;
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

describe("competition-saves", () => {
  it("throws a clear error when Supabase is not configured", async () => {
    mockClient = null;
    const { fetchSavedCompetitionIds } = await import("@/lib/competition-saves");
    await expect(fetchSavedCompetitionIds()).rejects.toThrow(
      "Supabase is not configured",
    );
  });

  it("fetchSaveCounts returns {} rather than throwing when unconfigured", async () => {
    mockClient = null;
    vi.resetModules();
    const { fetchSaveCounts } = await import("@/lib/competition-saves");
    await expect(fetchSaveCounts()).resolves.toEqual({});
  });

  it("fetchSaveCounts maps competition_stats rows into a Record", async () => {
    mockClient = {
      from: () => ({
        select: () =>
          Promise.resolve({
            data: [
              { competition_id: "a", save_count: 5 },
              { competition_id: "b", save_count: 12 },
            ],
            error: null,
          }),
      }),
    };
    vi.resetModules();
    const { fetchSaveCounts } = await import("@/lib/competition-saves");
    await expect(fetchSaveCounts()).resolves.toEqual({ a: 5, b: 12 });
  });

  it("fetchSavedCompetitionIds resolves to the ids Supabase returns (RLS scopes the rows)", async () => {
    mockClient = {
      from: () => ({
        select: () =>
          Promise.resolve({ data: [{ competition_id: "comp-1" }], error: null }),
      }),
    };
    vi.resetModules();
    const { fetchSavedCompetitionIds } = await import("@/lib/competition-saves");
    await expect(fetchSavedCompetitionIds()).resolves.toEqual(["comp-1"]);
  });

  it("saveCompetition throws when not signed in", async () => {
    mockClient = {
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      from: () => ({ insert: () => Promise.resolve({ error: null }) }),
    };
    vi.resetModules();
    const { saveCompetition } = await import("@/lib/competition-saves");
    await expect(saveCompetition("comp-1")).rejects.toThrow("Not signed in");
  });

  it("saveCompetition propagates a Supabase error", async () => {
    mockClient = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
      from: () => ({
        insert: () => Promise.resolve({ error: new Error("insert failed") }),
      }),
    };
    vi.resetModules();
    const { saveCompetition } = await import("@/lib/competition-saves");
    await expect(saveCompetition("comp-1")).rejects.toThrow("insert failed");
  });

  it("unsaveCompetition resolves when the delete succeeds", async () => {
    mockClient = {
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    };
    vi.resetModules();
    const { unsaveCompetition } = await import("@/lib/competition-saves");
    await expect(unsaveCompetition("comp-1")).resolves.toBeUndefined();
  });
});
