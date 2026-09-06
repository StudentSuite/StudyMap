import { describe, expect, it, vi } from "vitest";

import type { PersonalEventInput } from "@/lib/user-events";

let mockClient: unknown = null;
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

const INPUT: PersonalEventInput = {
  title: "SAT registration deadline",
  date: "2026-10-01",
  category: "deadline",
  notes: null,
};

describe("user-events", () => {
  it("fetchUserEvents throws a clear error when Supabase is not configured", async () => {
    mockClient = null;
    const { fetchUserEvents } = await import("@/lib/user-events");
    await expect(fetchUserEvents()).rejects.toThrow("Supabase is not configured");
  });

  it("fetchUserEvents orders by date ascending and returns [] for no rows", async () => {
    let orderedBy: unknown;
    mockClient = {
      from: () => ({
        select: () => ({
          order: (column: string, opts: unknown) => {
            orderedBy = { column, opts };
            return Promise.resolve({ data: null, error: null });
          },
        }),
      }),
    };
    vi.resetModules();
    const { fetchUserEvents } = await import("@/lib/user-events");
    await expect(fetchUserEvents()).resolves.toEqual([]);
    expect(orderedBy).toEqual({ column: "date", opts: { ascending: true } });
  });

  it("fetchUserEvents propagates a Supabase error", async () => {
    mockClient = {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: new Error("fetch failed") }),
        }),
      }),
    };
    vi.resetModules();
    const { fetchUserEvents } = await import("@/lib/user-events");
    await expect(fetchUserEvents()).rejects.toThrow("fetch failed");
  });

  it("createUserEvent sends the full input payload, including a null notes field, and returns the inserted row", async () => {
    let insertedPayload: unknown;
    mockClient = {
      from: () => ({
        insert: (payload: unknown) => {
          insertedPayload = payload;
          return {
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: "e1", user_id: "u1", created_at: "2026-01-01T00:00:00.000Z", ...INPUT },
                  error: null,
                }),
            }),
          };
        },
      }),
    };
    vi.resetModules();
    const { createUserEvent } = await import("@/lib/user-events");
    const result = await createUserEvent(INPUT);

    expect(insertedPayload).toEqual(INPUT);
    expect(result).toMatchObject({ id: "e1", title: INPUT.title, date: INPUT.date });
  });

  it("createUserEvent propagates a Supabase error rather than swallowing it", async () => {
    mockClient = {
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
    const { createUserEvent } = await import("@/lib/user-events");
    await expect(createUserEvent(INPUT)).rejects.toThrow("insert failed");
  });

  it("updateUserEvent scopes the update to the given id and returns the updated row", async () => {
    let scopedTo: unknown;
    let updatedPayload: unknown;
    mockClient = {
      from: () => ({
        update: (payload: PersonalEventInput) => {
          updatedPayload = payload;
          return {
            eq: (column: string, value: unknown) => {
              scopedTo = { column, value };
              return {
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: { id: "e1", user_id: "u1", created_at: "2026-01-01T00:00:00.000Z", ...payload },
                      error: null,
                    }),
                }),
              };
            },
          };
        },
      }),
    };
    vi.resetModules();
    const { updateUserEvent } = await import("@/lib/user-events");
    const updated = { ...INPUT, title: "Updated title" };
    const result = await updateUserEvent("e1", updated);

    expect(scopedTo).toEqual({ column: "id", value: "e1" });
    expect(updatedPayload).toEqual(updated);
    expect(result.title).toBe("Updated title");
  });

  it("deleteUserEvent resolves when the delete succeeds", async () => {
    mockClient = {
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    };
    vi.resetModules();
    const { deleteUserEvent } = await import("@/lib/user-events");
    await expect(deleteUserEvent("e1")).resolves.toBeUndefined();
  });

  it("deleteUserEvent propagates a Supabase error", async () => {
    mockClient = {
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: new Error("delete failed") }) }),
      }),
    };
    vi.resetModules();
    const { deleteUserEvent } = await import("@/lib/user-events");
    await expect(deleteUserEvent("e1")).rejects.toThrow("delete failed");
  });

  it("PERSONAL_EVENT_CATEGORIES covers every PersonalEventCategory with a label", async () => {
    const { PERSONAL_EVENT_CATEGORIES } = await import("@/lib/user-events");
    const values = PERSONAL_EVENT_CATEGORIES.map((c) => c.value);
    expect(values).toEqual(["deadline", "exam", "assignment", "reminder", "other"]);
    for (const entry of PERSONAL_EVENT_CATEGORIES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});
