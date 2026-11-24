import { createClient } from "@/lib/supabase/client";

/**
 * Saved public places (#355). Local-first: the list lives in this browser's
 * `localStorage`, so it works signed out, offline and on a self-hosted copy
 * with no Supabase. When signed in it is also kept in the `saved_places`
 * table, and the two are merged without losing or duplicating anything.
 */

const STORAGE_KEY = "studymap:saved-places";

/** Most places one list (or one shared link) may hold, so a URL stays a sane length. */
export const MAX_SAVED_PLACES = 100;

/** A dataset place id: letters, digits, underscore and hyphen, like `mum-library-07` or `12345`. */
const PLACE_ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

/** Keeps well-formed ids only, once each, in first-seen order, up to the cap. */
export function cleanIds(ids: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !PLACE_ID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_SAVED_PLACES) break;
  }
  return out;
}

/** The ids in a stored value, or [] for anything missing, malformed or not an array. */
export function parseStoredIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? cleanIds(value) : [];
  } catch {
    return [];
  }
}

/** The saved ids kept in this browser; [] when storage is empty, blocked or corrupt. */
export function loadSavedIds(): string[] {
  try {
    return parseStoredIds(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Keeps the list for the next visit. Silent when storage is unavailable (private mode, blocked cookies). */
export function storeSavedIds(ids: readonly string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanIds(ids)));
  } catch {
    // Storage can be full or blocked; saving still works for this visit.
  }
}

/** `a,b,c` from the `?saved=` parameter of a shared link; [] when absent or empty. */
export function parseSavedParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return cleanIds(raw.split(",").map((part) => part.trim()));
}

/** The value for a `?saved=` parameter, or "" for an empty list. */
export function savedParam(ids: readonly string[]): string {
  return cleanIds(ids).join(",");
}

/** Adds `id` when it is not in the list, removes it when it is. Returns a new list. */
export function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

/**
 * Both lists as one: everything from `local`, then whatever `remote` has that
 * `local` does not. Nothing is lost and nothing appears twice, whichever side
 * saved it first.
 */
export function mergeSavedIds(
  local: readonly string[],
  remote: readonly string[],
): string[] {
  return cleanIds([...local, ...remote]);
}

/** The ids that still exist in the dataset, in list order; the rest are dropped silently. */
export function pruneToDataset(
  ids: readonly string[],
  places: readonly { id: string }[],
): string[] {
  const known = new Set(places.map((place) => place.id));
  return ids.filter((id) => known.has(id));
}

// ---- Account sync ------------------------------------------------------------------------
// Only ever called for a signed-in visitor. A missing client means Supabase is not configured,
// which the callers treat as "stay local".

/** Every place id the signed-in visitor has saved on their account. */
export async function fetchSavedPlaceIds(): Promise<string[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("saved_places").select("place_id");
  if (error) throw error;
  return cleanIds((data ?? []).map((row) => row.place_id as unknown));
}

/** Saves `ids` on the account. Ids already there are left alone. */
export async function savePlaces(ids: readonly string[]): Promise<void> {
  const supabase = createClient();
  if (!supabase || ids.length === 0) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { error } = await supabase.from("saved_places").upsert(
    cleanIds(ids).map((place_id) => ({ place_id, user_id: data.user.id })),
    { onConflict: "user_id,place_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

/** Removes one saved place from the account. */
export async function unsavePlace(id: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.from("saved_places").delete().eq("place_id", id);
  if (error) throw error;
}
