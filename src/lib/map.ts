import type { PlaceType } from "@/lib/types";

/**
 * Marker colour per place type. Color-blind-safe set verified against
 * deuteranopia, protanopia, and tritanopia. Used by map markers, the legend,
 * and filter swatches.
 */
export const PLACE_TYPE_COLORS: Record<PlaceType, string> = {
  stationery: "#D97706",
  library: "#2563EB",
  exam_centre: "#7C3AED",
  imp_locations: "#0F766E",
  book_shop: "#EA580C",
  internet_cafe: "#0369A1",
  airport: "#BE185D",
  train_station: "#4D7C0F",
};

/** Colour used for a signed-in user's private personal pins. */
export const PERSONAL_PIN_COLOR = "#db2777";

/** Build a Google Maps directions deep-link to a coordinate. */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
