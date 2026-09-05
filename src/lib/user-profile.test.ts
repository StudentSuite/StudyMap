import { describe, expect, it, vi } from "vitest";

let mockClient: unknown = null;
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

describe("user-profile", () => {
  it("throws a clear error when Supabase is not configured", async () => {
    mockClient = null;
    const { fetchUserProfile } = await import("@/lib/user-profile");
    await expect(fetchUserProfile()).rejects.toThrow("Supabase is not configured");
  });

  it("hasSeenOnboarding does not swallow a misconfiguration error", async () => {
    // Guard rail: hasSeenOnboarding should only fail open on a missing-table
    // error, not on Supabase being misconfigured entirely - that's a bug,
    // not a "table not migrated yet" situation.
    mockClient = null;
    vi.resetModules();
    const { hasSeenOnboarding } = await import("@/lib/user-profile");
    await expect(hasSeenOnboarding()).rejects.toThrow("Supabase is not configured");
  });

  it("hasSeenOnboarding fails open (reports seen) when the table doesn't exist yet", async () => {
    mockClient = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
      from: () => ({
        select: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: { code: "PGRST205" } }),
        }),
      }),
    };
    vi.resetModules();
    const { hasSeenOnboarding } = await import("@/lib/user-profile");
    await expect(hasSeenOnboarding()).resolves.toBe(true);
  });

  it("hasSeenOnboarding is false when no row exists", async () => {
    mockClient = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
      from: () => ({
        select: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
    vi.resetModules();
    const { hasSeenOnboarding } = await import("@/lib/user-profile");
    await expect(hasSeenOnboarding()).resolves.toBe(false);
  });

  it("hasSeenOnboarding is true once a row exists, even blank", async () => {
    mockClient = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
      from: () => ({
        select: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { user_id: "u1", graduation_year: null, board: null },
              error: null,
            }),
        }),
      }),
    };
    vi.resetModules();
    const { hasSeenOnboarding } = await import("@/lib/user-profile");
    await expect(hasSeenOnboarding()).resolves.toBe(true);
  });

  it("graduationYearOptions returns the current year through +6", async () => {
    const { graduationYearOptions } = await import("@/lib/user-profile");
    expect(graduationYearOptions(new Date("2026-09-05T00:00:00Z"))).toEqual([
      2026, 2027, 2028, 2029, 2030, 2031, 2032,
    ]);
  });

  it("boardToExamBoards maps IB and IGCSE, and defaults everything else to null", async () => {
    const { boardToExamBoards } = await import("@/lib/user-profile");
    expect(boardToExamBoards("IB")).toEqual(["IB"]);
    expect(boardToExamBoards("IGCSE")).toEqual(["IGCSE"]);
    expect(boardToExamBoards("CBSE")).toBeNull();
    expect(boardToExamBoards("Other")).toBeNull();
    expect(boardToExamBoards(null)).toBeNull();
  });

  it("profileCompetitionCountry passes through a real competition country and rejects the rest", async () => {
    const { profileCompetitionCountry } = await import("@/lib/user-profile");
    expect(profileCompetitionCountry("IN")).toBe("IN");
    expect(profileCompetitionCountry("US")).toBe("US");
    expect(profileCompetitionCountry("Other")).toBeNull();
    expect(profileCompetitionCountry(null)).toBeNull();
  });
});
