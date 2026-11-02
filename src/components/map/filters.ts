import type { City, PlaceType } from "@/lib/types";

/** Active map filters, mirrored into the URL query for shareable links. */
export interface PlaceFilters {
  types: PlaceType[];
  city: City | null;
  /** ISO 3166-1 alpha-2 code, or null for all countries. */
  country: string | null;
  query: string;
}
