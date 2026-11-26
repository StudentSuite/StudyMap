import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    rows: [] as string[],
    upserts: [] as Array<{ rows: unknown; options: unknown }>,
    deletes: [] as Array<[string, string]>,
    user: { id: "user-1" } as { id: string } | null,
    error: null as Error | null,
    configured: true,
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () =>
    db.configured
      ? {
          auth: { getUser: async () => ({ data: { user: db.user } }) },
          from: () => ({
            select: async () => ({
              data: db.rows.map((place_id) => ({ place_id })),
              error: db.error,
            }),
            upsert: async (rows: unknown, options: unknown) => {
              db.upserts.push({ rows, options });
              return { error: db.error };
            },
            delete: () => ({
              eq: async (column: string, value: string) => {
                db.deletes.push([column, value]);
                return { error: db.error };
              },
            }),
          }),
        }
      : null,
}));

import {
  MAX_SAVED_PLACES,
  cleanIds,
  fetchSavedPlaceIds,
  loadSavedIds,
  mergeSavedIds,
  parseSavedParam,
  parseStoredIds,
  pruneToDataset,
  savePlaces,
  savedParam,
  storeSavedIds,
  toggleId,
  unsavePlace,
} from "@/lib/saved-places";

beforeEach(() => {
  db.rows = [];
  db.upserts = [];
  db.deletes = [];
  db.user = { id: "user-1" };
  db.error = null;
  db.configured = true;
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("cleanIds", () => {
  it("keeps well-formed ids once each, in first-seen order", () => {
    expect(cleanIds(["mum-library-07", "12345", "mum-library-07", "a_b-c"])).toEqual([
      "mum-library-07",
      "12345",
      "a_b-c",
    ]);
  });

  it("drops anything that is not a plain id", () => {
    expect(
      cleanIds(["", "has space", "a,b", "<script>", "x".repeat(81), 7, null, {}, "ok"]),
    ).toEqual(["ok"]);
  });

  it("caps the list so a shared link stays a sane length", () => {
    const many = Array.from({ length: MAX_SAVED_PLACES + 50 }, (_, i) => `p${i}`);
    expect(cleanIds(many)).toHaveLength(MAX_SAVED_PLACES);
  });
});

describe("parseStoredIds", () => {
  it("reads a stored list", () => {
    expect(parseStoredIds('["a","b"]')).toEqual(["a", "b"]);
  });

  it.each([[null], [undefined], [""], ["not json"], ["null"], ['{"a":1}'], ['"a"']])(
    "gives an empty list for %j",
    (raw) => {
      expect(parseStoredIds(raw as string | null | undefined)).toEqual([]);
    },
  );

  it("drops bad entries inside an otherwise valid list", () => {
    expect(parseStoredIds('["a", 3, "b c", "d"]')).toEqual(["a", "d"]);
  });
});

describe("loadSavedIds and storeSavedIds", () => {
  it("round-trips a list", () => {
    storeSavedIds(["a", "b"]);
    expect(loadSavedIds()).toEqual(["a", "b"]);
  });

  it("is empty before anything is saved", () => {
    expect(loadSavedIds()).toEqual([]);
  });

  it("returns an empty list instead of throwing when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadSavedIds()).toEqual([]);
  });

  it("does not throw when storage is full or blocked on write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => storeSavedIds(["a"])).not.toThrow();
  });
});

describe("parseSavedParam and savedParam", () => {
  it("round-trips a shortlist", () => {
    expect(parseSavedParam(savedParam(["mum-library-07", "12345"]))).toEqual([
      "mum-library-07",
      "12345",
    ]);
  });

  it("gives an empty list for a missing or empty parameter", () => {
    expect(parseSavedParam(null)).toEqual([]);
    expect(parseSavedParam("")).toEqual([]);
    expect(parseSavedParam(" , ,")).toEqual([]);
    expect(savedParam([])).toBe("");
  });

  it("ignores malformed ids, trims spaces and removes duplicates", () => {
    expect(parseSavedParam(" a , b,a,<x>,c d ")).toEqual(["a", "b"]);
  });
});

describe("toggleId", () => {
  it("adds an id that is missing and removes one that is present, without mutating", () => {
    const list = ["a", "b"];
    expect(toggleId(list, "c")).toEqual(["a", "b", "c"]);
    expect(toggleId(list, "a")).toEqual(["b"]);
    expect(list).toEqual(["a", "b"]);
  });
});

describe("mergeSavedIds", () => {
  it("keeps everything from both sides, with no duplicates", () => {
    expect(mergeSavedIds(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("loses nothing when either side is empty", () => {
    expect(mergeSavedIds([], ["x", "y"])).toEqual(["x", "y"]);
    expect(mergeSavedIds(["x", "y"], [])).toEqual(["x", "y"]);
    expect(mergeSavedIds([], [])).toEqual([]);
  });

  it("is stable when merged again with the result", () => {
    const once = mergeSavedIds(["a", "b"], ["b", "c"]);
    expect(mergeSavedIds(once, ["c", "a"])).toEqual(once);
  });
});

describe("pruneToDataset", () => {
  it("drops ids whose place no longer exists, keeping the order of the rest", () => {
    const places = [{ id: "a" }, { id: "c" }];
    expect(pruneToDataset(["c", "gone", "a", "also-gone"], places)).toEqual(["c", "a"]);
  });

  it("gives an empty list for an empty dataset", () => {
    expect(pruneToDataset(["a"], [])).toEqual([]);
  });
});

describe("account sync", () => {
  it("reads the account's saved place ids", async () => {
    db.rows = ["a", "b"];
    expect(await fetchSavedPlaceIds()).toEqual(["a", "b"]);
  });

  it("throws on a database error so the caller can stay local", async () => {
    db.error = new Error("relation does not exist");
    await expect(fetchSavedPlaceIds()).rejects.toThrow("relation does not exist");
  });

  it("saves ids with an upsert that leaves existing rows alone", async () => {
    await savePlaces(["a", "b", "a"]);
    expect(db.upserts).toEqual([
      {
        rows: [
          { place_id: "a", user_id: "user-1" },
          { place_id: "b", user_id: "user-1" },
        ],
        options: { onConflict: "user_id,place_id", ignoreDuplicates: true },
      },
    ]);
  });

  it("does nothing for an empty list, a missing client or a signed-out visitor", async () => {
    await savePlaces([]);
    db.user = null;
    await savePlaces(["a"]);
    db.configured = false;
    await savePlaces(["a"]);
    expect(db.upserts).toEqual([]);
    expect(await fetchSavedPlaceIds()).toEqual([]);
  });

  it("removes one saved place by id", async () => {
    await unsavePlace("a");
    expect(db.deletes).toEqual([["place_id", "a"]]);
  });

  it("surfaces a failed write", async () => {
    db.error = new Error("denied");
    await expect(savePlaces(["a"])).rejects.toThrow("denied");
    await expect(unsavePlace("a")).rejects.toThrow("denied");
  });
});
