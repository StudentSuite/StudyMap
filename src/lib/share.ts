import { PLACE_TYPES } from "@/lib/types";
import type { City, PlaceType } from "@/lib/types";

export interface MapShareState {
  types: PlaceType[];
  city: City | null;
  placeId: string | null;
  /** Optional viewport: map center coordinates and zoom level. */
  lat: number | null;
  lng: number | null;
  zoom: number | null;
}

const TYPE_SET = new Set<string>(PLACE_TYPES);

function parseList(raw: string | null, allowed: Set<string>): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => allowed.has(value));
}

function parseNumber(raw: string | null, min?: number, max?: number): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (min !== undefined && value < min) return null;
  if (max !== undefined && value > max) return null;
  return value;
}

/** Read filter, focused-pin, and viewport state out of a URL query string. */
export function parseMapState(search: string): MapShareState {
  const params = new URLSearchParams(search);
  const city = params.get("city")?.trim() || null;
  const lat = parseNumber(params.get("lat"), -90, 90);
  const lng = parseNumber(params.get("lng"), -180, 180);
  const zoom = parseNumber(params.get("zoom"), 0, 20);
  // A viewport only makes sense with both coordinates; otherwise ignore all three.
  const hasViewport = lat !== null && lng !== null;
  return {
    types: parseList(params.get("types"), TYPE_SET) as PlaceType[],
    city,
    placeId: params.get("place"),
    lat: hasViewport ? lat : null,
    lng: hasViewport ? lng : null,
    zoom: hasViewport ? zoom : null,
  };
}

/** Serialise state to a query string ("" when nothing is set). */
export function mapStateToSearch(state: MapShareState): string {
  const params = new URLSearchParams();
  if (state.types.length) params.set("types", state.types.join(","));
  if (state.city) params.set("city", state.city);
  if (state.placeId) params.set("place", state.placeId);
  if (state.lat !== null && state.lng !== null) {
    params.set("lat", String(state.lat));
    params.set("lng", String(state.lng));
    if (state.zoom !== null) params.set("zoom", String(state.zoom));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Absolute URL for the current map state, for copy-to-clipboard sharing. */
export function buildShareUrl(state: MapShareState): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${mapStateToSearch(state)}`;
}
