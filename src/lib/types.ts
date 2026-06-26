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

export const CITIES = ["mumbai", "thane", "navi_mumbai", "jakarta", "depok"] as const;

export type City = (typeof CITIES)[number];

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

export const CITY_LABELS: Record<City, string> = {
  mumbai: "Mumbai",
  thane: "Thane",
  navi_mumbai: "Navi Mumbai",
  jakarta: "Jakarta",
  depok: "Depok",
};

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

