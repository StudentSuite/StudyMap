"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  fetchSavedPlaceIds,
  loadSavedIds,
  mergeSavedIds,
  savePlaces,
  storeSavedIds,
  toggleId,
  unsavePlace,
} from "@/lib/saved-places";

export interface SavedPlaceList {
  /** Saved place ids, in the order they were saved. */
  ids: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Adds several ids at once (e.g. a shared shortlist), keeping what is already saved. */
  addMany: (ids: readonly string[]) => void;
}

/**
 * The visitor's saved public places (#355). Kept in this browser first, so it
 * works signed out and offline; when `userId` is set the list is also kept on
 * the account. On sign-in the browser's list and the account's list are merged
 * (nothing lost, nothing duplicated) and each side is topped up with what it
 * was missing.
 */
export function useSavedPlaces(userId: string | null): SavedPlaceList {
  const [ids, setIds] = React.useState<string[]>(() =>
    typeof window === "undefined" ? [] : loadSavedIds(),
  );

  // Keep several open tabs in step: another tab saving writes storage first.
  React.useEffect(() => {
    function onStorage() {
      setIds(loadSavedIds());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Signing in: merge this browser's list with the account's.
  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchSavedPlaceIds()
      .then((remote) => {
        if (cancelled) return;
        const local = loadSavedIds();
        const merged = mergeSavedIds(local, remote);
        setIds(merged);
        storeSavedIds(merged);
        const missingRemotely = merged.filter((id) => !remote.includes(id));
        if (missingRemotely.length > 0) return savePlaces(missingRemotely);
      })
      .catch(() => {
        // The table may not be set up yet, or the network is down: the list
        // simply stays local until the next sign-in.
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const commit = React.useCallback((next: string[]) => {
    setIds(next);
    storeSavedIds(next);
  }, []);

  const toggle = React.useCallback(
    (id: string) => {
      const wasSaved = ids.includes(id);
      commit(toggleId(ids, id));
      if (!userId) return;
      (wasSaved ? unsavePlace(id) : savePlaces([id])).catch(() => {
        toast.error("Saved on this device, but it could not be synced to your account.");
      });
    },
    [ids, userId, commit],
  );

  const addMany = React.useCallback(
    (more: readonly string[]) => {
      const merged = mergeSavedIds(ids, more);
      const added = merged.filter((id) => !ids.includes(id));
      if (added.length === 0) return;
      commit(merged);
      if (userId) {
        savePlaces(added).catch(() => {
          toast.error(
            "Saved on this device, but it could not be synced to your account.",
          );
        });
      }
    },
    [ids, userId, commit],
  );

  const isSaved = React.useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, isSaved, toggle, addMany };
}
