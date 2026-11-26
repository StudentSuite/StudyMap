import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { remote, toastError } = vi.hoisted(() => ({
  remote: {
    ids: [] as string[],
    saved: [] as string[][],
    removed: [] as string[],
    failFetch: false,
    failWrite: false,
  },
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: toastError } }));
vi.mock("@/lib/saved-places", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/saved-places")>("@/lib/saved-places");
  return {
    ...actual,
    fetchSavedPlaceIds: async () => {
      if (remote.failFetch) throw new Error("no table");
      return [...remote.ids];
    },
    savePlaces: async (ids: readonly string[]) => {
      if (remote.failWrite) throw new Error("denied");
      remote.saved.push([...ids]);
    },
    unsavePlace: async (id: string) => {
      if (remote.failWrite) throw new Error("denied");
      remote.removed.push(id);
    },
  };
});

import { useSavedPlaces } from "@/components/map/use-saved-places";
import { loadSavedIds, storeSavedIds } from "@/lib/saved-places";

beforeEach(() => {
  remote.ids = [];
  remote.saved = [];
  remote.removed = [];
  remote.failFetch = false;
  remote.failWrite = false;
  toastError.mockReset();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("useSavedPlaces signed out", () => {
  it("starts from what this browser already saved", () => {
    storeSavedIds(["a", "b"]);
    const { result } = renderHook(() => useSavedPlaces(null));
    expect(result.current.ids).toEqual(["a", "b"]);
    expect(result.current.isSaved("a")).toBe(true);
    expect(result.current.isSaved("z")).toBe(false);
  });

  it("saves and unsaves, keeping the list in storage so it survives a reload", () => {
    const { result, unmount } = renderHook(() => useSavedPlaces(null));

    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    expect(result.current.ids).toEqual(["a", "b"]);
    expect(loadSavedIds()).toEqual(["a", "b"]);

    unmount();
    const reloaded = renderHook(() => useSavedPlaces(null));
    expect(reloaded.result.current.ids).toEqual(["a", "b"]);

    act(() => reloaded.result.current.toggle("a"));
    expect(loadSavedIds()).toEqual(["b"]);
  });

  it("never calls the account while signed out", () => {
    const { result } = renderHook(() => useSavedPlaces(null));
    act(() => result.current.toggle("a"));
    expect(remote.saved).toEqual([]);
    expect(remote.removed).toEqual([]);
  });

  it("adds a shared shortlist to the list without duplicating what is there", () => {
    storeSavedIds(["a"]);
    const { result } = renderHook(() => useSavedPlaces(null));

    act(() => result.current.addMany(["a", "b", "c"]));

    expect(result.current.ids).toEqual(["a", "b", "c"]);
    expect(loadSavedIds()).toEqual(["a", "b", "c"]);
  });

  it("follows a change made in another tab", () => {
    const { result } = renderHook(() => useSavedPlaces(null));
    expect(result.current.ids).toEqual([]);

    act(() => {
      storeSavedIds(["x"]);
      window.dispatchEvent(new Event("storage"));
    });

    expect(result.current.ids).toEqual(["x"]);
  });

  it("opens with an empty list when stored data is corrupt", () => {
    window.localStorage.setItem("studymap:saved-places", "{{not json");
    const { result } = renderHook(() => useSavedPlaces(null));
    expect(result.current.ids).toEqual([]);
  });
});

describe("useSavedPlaces signed in", () => {
  it("merges this browser's list with the account's: nothing lost, nothing duplicated", async () => {
    storeSavedIds(["a", "b"]);
    remote.ids = ["b", "c"];

    const { result } = renderHook(() => useSavedPlaces("user-1"));

    await waitFor(() => expect(result.current.ids).toEqual(["a", "b", "c"]));
    expect(loadSavedIds()).toEqual(["a", "b", "c"]);
    // Only what the account was missing is sent up.
    expect(remote.saved).toEqual([["a"]]);
  });

  it("sends nothing up when the account already has everything", async () => {
    storeSavedIds(["a"]);
    remote.ids = ["a", "b"];

    const { result } = renderHook(() => useSavedPlaces("user-1"));

    await waitFor(() => expect(result.current.ids).toEqual(["a", "b"]));
    expect(remote.saved).toEqual([]);
  });

  it("fills an empty browser from the account", async () => {
    remote.ids = ["x", "y"];
    const { result } = renderHook(() => useSavedPlaces("user-1"));
    await waitFor(() => expect(result.current.ids).toEqual(["x", "y"]));
    expect(loadSavedIds()).toEqual(["x", "y"]);
  });

  it("keeps the local list when the account cannot be read", async () => {
    storeSavedIds(["a"]);
    remote.failFetch = true;

    const { result } = renderHook(() => useSavedPlaces("user-1"));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.ids).toEqual(["a"]);
  });

  it("saves and unsaves on the account as well as locally", async () => {
    const { result } = renderHook(() => useSavedPlaces("user-1"));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => result.current.toggle("a"));
    expect(remote.saved).toContainEqual(["a"]);

    act(() => result.current.toggle("a"));
    expect(remote.removed).toEqual(["a"]);
    expect(result.current.ids).toEqual([]);
  });

  it("tells the visitor, and keeps the star, when the account write fails", async () => {
    remote.failWrite = true;
    const { result } = renderHook(() => useSavedPlaces("user-1"));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => result.current.toggle("a"));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(result.current.ids).toEqual(["a"]);
    expect(loadSavedIds()).toEqual(["a"]);
  });

  it("sends only the newly added places to the account for a shared shortlist", async () => {
    storeSavedIds(["a"]);
    remote.ids = ["a"];
    const { result } = renderHook(() => useSavedPlaces("user-1"));
    await waitFor(() => expect(result.current.ids).toEqual(["a"]));

    act(() => result.current.addMany(["a", "b"]));

    expect(remote.saved).toContainEqual(["b"]);
  });
});
