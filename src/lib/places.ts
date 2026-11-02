import type { City, Place } from "@/lib/types";
import studyMapConfig from "../../studymap.config";
import { getCities as getCitiesFrom } from "@/lib/places-utils";

export { cityBounds, filterPlaces } from "@/lib/places-utils";
export type { Bounds } from "@/lib/places-utils";

/** All public places, sourced from `studymap.config.ts`. */
export function getPlaces(): Place[] {
  return studyMapConfig.places;
}

/**
 * Every distinct city slug present in `places`, ordered by `preferredOrder`
 * (defaulting to `studymap.config.ts`'s `cities` registry) with any city not
 * in that list appended alphabetically after.
 */
export function getCities(
  places: Place[],
  preferredOrder: readonly City[] = studyMapConfig.cities,
): City[] {
  return getCitiesFrom(places, preferredOrder);
}
