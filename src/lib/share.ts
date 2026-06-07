import { CITIES, PLACE_TYPES } from "@/lib/types";
import type { City, PlaceType } from "@/lib/types";

export interface MapShareState {
  types: PlaceType[];
  cities: City[];
  placeId: string | null;
}

const TYPE_SET = new Set<string>(PLACE_TYPES);
const CITY_SET = new Set<string>(CITIES);

function parseList(raw: string | null, allowed: Set<string>): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => allowed.has(value));
}

/** Read filter and focused-pin state out of a URL query string. */
export function parseMapState(search: string): MapShareState {
  const params = new URLSearchParams(search);
  return {
    types: parseList(params.get("types"), TYPE_SET) as PlaceType[],
    cities: parseList(params.get("cities"), CITY_SET) as City[],
    placeId: params.get("place"),
  };
}

/** Serialise state to a query string ("" when nothing is set). */
export function mapStateToSearch(state: MapShareState): string {
  const params = new URLSearchParams();
  if (state.types.length) params.set("types", state.types.join(","));
  if (state.cities.length) params.set("cities", state.cities.join(","));
  if (state.placeId) params.set("place", state.placeId);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Absolute URL for the current map state, for copy-to-clipboard sharing. */
export function buildShareUrl(state: MapShareState): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${mapStateToSearch(state)}`;
}
