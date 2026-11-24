import type { City, PlaceType } from "@/lib/types";

/** Active map filters, mirrored into the URL query for shareable links. */
export interface PlaceFilters {
  types: PlaceType[];
  city: City | null;
  /** ISO 3166-1 alpha-2 code, or null for all countries. */
  country: string | null;
  query: string;
}

/** The visible map rectangle, in degrees. A view wider than the world reports `east - west` of 360 or more. */
export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** Zoom at and above which the list follows the map by default (#351). Below it the map shows a whole region, so listing it all is the useful view. */
export const IN_VIEW_AUTO_ZOOM = 8;

/** Whether the "only places in this view" filter is on: the visitor's choice, else automatic from the zoom. */
export function wantsInView(preference: boolean | null, zoom: number): boolean {
  return preference ?? zoom >= IN_VIEW_AUTO_ZOOM;
}

/** True when a point lies inside `bounds`, including a view that wraps past the antimeridian. */
export function inBounds(
  point: { lat: number; lng: number },
  bounds: MapBounds,
): boolean {
  if (point.lat < bounds.south || point.lat > bounds.north) return false;
  const span = bounds.east - bounds.west;
  if (span >= 360) return true;
  // Measure east of the west edge, wrapped into [0, 360), so lng 179 and -179 compare correctly.
  const offset = (((point.lng - bounds.west) % 360) + 360) % 360;
  return offset <= span;
}

/** The places that fall inside `bounds`, in their original order. */
export function filterByBounds<T extends { lat: number; lng: number }>(
  places: readonly T[],
  bounds: MapBounds,
): T[] {
  return places.filter((place) => inBounds(place, bounds));
}

/** True when two views are the same to within `tolerance` degrees, so a nudge does not offer "Search this area". */
export function sameBounds(a: MapBounds, b: MapBounds, tolerance = 0.0005): boolean {
  return (
    Math.abs(a.west - b.west) <= tolerance &&
    Math.abs(a.south - b.south) <= tolerance &&
    Math.abs(a.east - b.east) <= tolerance &&
    Math.abs(a.north - b.north) <= tolerance
  );
}
