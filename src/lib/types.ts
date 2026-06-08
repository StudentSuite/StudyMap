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

export const CITIES = ["mumbai", "thane", "navi_mumbai"] as const;

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

/** A private place saved by a signed-in user. Never exposed publicly. */
export const PERSONAL_PIN_TYPES = [
  "home",
  "school",
  "office",
  "coaching",
  "custom",
] as const;

export type PersonalPinType = (typeof PERSONAL_PIN_TYPES)[number];

export interface PersonalPin {
  id: string;
  owner_id: string;
  name: string;
  type: PersonalPinType;
  lat: number;
  lng: number;
  note?: string;
  created_at: string;
}

export const BOARDS = ["IB", "IGCSE", "NEET", "JEE", "UPSC", "SAT"] as const;

export type Board = (typeof BOARDS)[number];

export const RESOURCE_KINDS = ["past_paper", "website", "portal"] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  past_paper: "Past paper",
  website: "Website",
  portal: "Portal",
};

/**
 * A catalogue entry. The site never hosts files; `url` always points out to an
 * official board site, past-paper archive, or registration portal.
 */
export interface Resource {
  id: string;
  board: Board;
  subject?: string;
  year?: number;
  kind: ResourceKind;
  title: string;
  url: string;
}
