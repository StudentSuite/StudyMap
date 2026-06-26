export const PLACE_TYPES = [
  "book_shop",
  "library",
  "exam_centre",
  "imp_locations",
  "stationery",
  "internet_cafe",
  "airport",
  "train_station",
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

/**
 * A place's city is a free-form slug (lowercase, underscore-separated,
 * e.g. "navi_mumbai", "new_delhi"). Not a fixed enum: contributors can add
 * places in any city, and the map's city picker is built from whatever
 * slugs are actually present in the dataset.
 */
export type City = string;

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  book_shop: "Book shop",
  library: "Library",
  exam_centre: "Exam centre",
  imp_locations: "Important locations",
  stationery: "Stationery",
  internet_cafe: "Internet cafe",
  airport: "Airport",
  train_station: "Train station",
};

/** Turns a city slug into a display label, e.g. "navi_mumbai" -> "Navi Mumbai". */
export function humanizeCity(city: City): string {
  return city
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * A public place pin. This is the entire committed record shape.
 * Proof of quality (source citation, Google Maps rating and review count,
 * verified date) lives in the contribution PR, not in this dataset.
 */
export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  city: City;
  lat: number;
  lng: number;
  address?: string;
  gmaps_link: string;
  added_by: string;
}

