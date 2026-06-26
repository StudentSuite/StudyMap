import type { City, Place, PlaceType } from "@/lib/types";

import airport from "../../data/places/airport.json";
import bookShop from "../../data/places/book_shop.json";
import stationery from "../../data/places/stationery.json";
import examCentre from "../../data/places/exam_centre.json";
import internetCafe from "../../data/places/internet_cafe.json";
import library from "../../data/places/library.json";
import impLocations from "../../data/places/imp_locations.json";
import trainStation from "../../data/places/train_station.json";

const ALL: Place[] = [
  ...(airport as Place[]),
  ...(bookShop as Place[]),
  ...(stationery as Place[]),
  ...(examCentre as Place[]),
  ...(internetCafe as Place[]),
  ...(library as Place[]),
  ...(impLocations as Place[]),
  ...(trainStation as Place[]),
];

/** All public places, merged from the per-type JSON files. */
export function getPlaces(): Place[] {
  return ALL;
}

export function filterPlaces(
  places: Place[],
  opts: { types?: PlaceType[]; cities?: City[] },
): Place[] {
  return places.filter((place) => {
    if (opts.types && opts.types.length > 0 && !opts.types.includes(place.type)) {
      return false;
    }
    if (opts.cities && opts.cities.length > 0 && !opts.cities.includes(place.city)) {
      return false;
    }
    return true;
  });
}
