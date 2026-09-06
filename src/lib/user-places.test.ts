import { describe, expect, it, vi } from "vitest";

import type { UserPlaceRow } from "@/lib/user-places";

let mockClient: unknown = null;
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

function row(overrides: Partial<UserPlaceRow> = {}): UserPlaceRow {
  return {
    id: "row-1",
    user_id: "u1",
    name: "My Local Library",
    type: "library",
    city: "mumbai",
    lat: 19.076,
    lng: 72.8777,
    address: "123 Main St",
    note: "Quiet on weekdays",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("userPlaceToPlace", () => {
  it("maps a saved place row into the public Place shape, namespacing the id", async () => {
    const { userPlaceToPlace } = await import("@/lib/user-places");
    const result = userPlaceToPlace(row());

    expect(result).toEqual({
      id: "own-row-1",
      name: "My Local Library",
      type: "library",
      city: "mumbai",
      lat: 19.076,
      lng: 72.8777,
      address: "123 Main St",
      gmaps_link: "https://maps.google.com/?q=19.076,72.8777",
      added_by: "you",
    });
  });

  it("converts a null address to undefined rather than passing null through", async () => {
    const { userPlaceToPlace } = await import("@/lib/user-places");
    const result = userPlaceToPlace(row({ address: null }));
    expect(result.address).toBeUndefined();
  });

  it("always marks the result as added_by 'you', indistinguishable in shape from public places", async () => {
    const { userPlaceToPlace } = await import("@/lib/user-places");
    const result = userPlaceToPlace(row());
    expect(result.added_by).toBe("you");
    expect(result).toHaveProperty("gmaps_link");
  });
});

describe("user-places error classification / Supabase gating", () => {
  it("fetchUserPlaces throws a clear error when Supabase is not configured", async () => {
    mockClient = null;
    vi.resetModules();
    const { fetchUserPlaces } = await import("@/lib/user-places");
    await expect(fetchUserPlaces()).rejects.toThrow("Supabase is not configured");
  });

  it("createUserPlace throws when not signed in", async () => {
    mockClient = {
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      from: () => ({
        insert: () => ({
          select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        }),
      }),
    };
    vi.resetModules();
    const { createUserPlace } = await import("@/lib/user-places");
    await expect(
      createUserPlace({
        name: "New Spot",
        type: "library",
        city: "mumbai",
        lat: 19,
        lng: 72.8,
        address: null,
        note: null,
      }),
    ).rejects.toThrow("Not signed in");
  });

  it("createUserPlace propagates a Supabase error rather than swallowing it", async () => {
    mockClient = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({ data: null, error: new Error("insert failed") }),
          }),
        }),
      }),
    };
    vi.resetModules();
    const { createUserPlace } = await import("@/lib/user-places");
    await expect(
      createUserPlace({
        name: "New Spot",
        type: "library",
        city: "mumbai",
        lat: 19,
        lng: 72.8,
        address: null,
        note: null,
      }),
    ).rejects.toThrow("insert failed");
  });

  it("fetchUserPlaces returns [] when Supabase returns no rows", async () => {
    mockClient = {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
    vi.resetModules();
    const { fetchUserPlaces } = await import("@/lib/user-places");
    await expect(fetchUserPlaces()).resolves.toEqual([]);
  });

  it("deleteUserPlace resolves when the delete succeeds", async () => {
    mockClient = {
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    };
    vi.resetModules();
    const { deleteUserPlace } = await import("@/lib/user-places");
    await expect(deleteUserPlace("row-1")).resolves.toBeUndefined();
  });

  it("deleteUserPlace propagates a Supabase error", async () => {
    mockClient = {
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: new Error("boom") }) }),
      }),
    };
    vi.resetModules();
    const { deleteUserPlace } = await import("@/lib/user-places");
    await expect(deleteUserPlace("row-1")).rejects.toThrow("boom");
  });

  it("fetchUserHome throws a clear error when Supabase is not configured", async () => {
    mockClient = null;
    vi.resetModules();
    const { fetchUserHome } = await import("@/lib/user-places");
    await expect(fetchUserHome()).rejects.toThrow("Supabase is not configured");
  });

  it("fetchUserHome returns null when no home is saved", async () => {
    mockClient = {
      from: () => ({
        select: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
    vi.resetModules();
    const { fetchUserHome } = await import("@/lib/user-places");
    await expect(fetchUserHome()).resolves.toBeNull();
  });

  it("deleteUserHome scopes the delete to the signed-in user", async () => {
    let scopedTo: unknown;
    mockClient = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }) },
      from: () => ({
        delete: () => ({
          eq: (column: string, value: unknown) => {
            scopedTo = { column, value };
            return Promise.resolve({ error: null });
          },
        }),
      }),
    };
    vi.resetModules();
    const { deleteUserHome } = await import("@/lib/user-places");
    await expect(deleteUserHome()).resolves.toBeUndefined();
    expect(scopedTo).toEqual({ column: "user_id", value: "u1" });
  });
});
