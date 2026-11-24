/**
 * Shared rules for where the map starts and how far it zooms to reach a place.
 * Kept free of Leaflet and React so the rules can be unit-tested on their own.
 */

/** Highest zoom a fit or search may reach. Streets and landmarks are still drawn here; above it the basemap thins out (#353). */
export const FIT_MAX_ZOOM = 16;

/** Zoom used when flying to one chosen place, and the cap when fitting several (#353). */
export const GO_TO_PLACE_ZOOM = 15;

/** Zoom used when the map opens on the signed-in user's saved home (#350). */
export const HOME_ZOOM = 11;

const STORAGE_KEY = "studymap:last-viewport";

export interface StoredViewport {
  lat: number;
  lng: number;
  zoom: number;
}

/** Highest zoom to allow when fitting `count` places: a lone place may go closer than a group. */
export function fitMaxZoom(count: number): number {
  return count <= 1 ? FIT_MAX_ZOOM : GO_TO_PLACE_ZOOM;
}

/** Reads a stored viewport, returning null for anything missing, malformed or out of range. */
export function parseStoredViewport(
  raw: string | null | undefined,
): StoredViewport | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { lat, lng, zoom } = value as Record<string, unknown>;
    if (typeof lat !== "number" || typeof lng !== "number" || typeof zoom !== "number") {
      return null;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom))
      return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    if (zoom < 0 || zoom > 22) return null;
    return { lat, lng, zoom };
  } catch {
    return null;
  }
}

/** The viewport the visitor last used, or null when storage is empty, blocked or corrupt. */
export function loadViewport(): StoredViewport | null {
  try {
    return parseStoredViewport(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Remembers the viewport for the next visit. Silent when storage is unavailable (private mode, blocked cookies). */
export function saveViewport(viewport: StoredViewport): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(viewport));
  } catch {
    // Storage can be full or blocked; the map still works without it.
  }
}

/** URL state that expresses an explicit intent, which must win over a remembered viewport. */
export interface StartIntent {
  placeId?: string | null;
  query?: string;
  city?: string | null;
  country?: string | null;
  types?: readonly string[];
}

/** True when the URL asks for something specific, so the last-used viewport should not override it. */
export function hasExplicitIntent(intent: StartIntent): boolean {
  return Boolean(
    intent.placeId ||
    (intent.query && intent.query.trim()) ||
    intent.city ||
    intent.country ||
    (intent.types && intent.types.length > 0),
  );
}
