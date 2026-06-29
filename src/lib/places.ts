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
  opts: { types?: PlaceType[]; city?: City | null; query?: string },
): Place[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  return places.filter((place) => {
    if (opts.types && opts.types.length > 0 && !opts.types.includes(place.type)) {
      return false;
    }
    if (opts.city && place.city !== opts.city) {
      return false;
    }
    if (q) {
      const cityNorm = place.city.replace(/_/g, " ");
      if (!place.name.toLowerCase().includes(q) && !cityNorm.includes(q)) {
        return false;
      }
    }
    return true;
  });
}

/** Every distinct city slug present in the dataset, sorted alphabetically. */
export function getCities(places: Place[]): City[] {
  return Array.from(new Set(places.map((place) => place.city))).sort();
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Bounding box of every place in `city`, for flying the map to that city. */
export function cityBounds(places: Place[], city: City): Bounds | null {
  const inCity = places.filter((place) => place.city === city);
  if (inCity.length === 0) return null;

  return inCity.reduce<Bounds>(
    (bounds, place) => ({
      minLat: Math.min(bounds.minLat, place.lat),
      maxLat: Math.max(bounds.maxLat, place.lat),
      minLng: Math.min(bounds.minLng, place.lng),
      maxLng: Math.max(bounds.maxLng, place.lng),
    }),
    {
      minLat: inCity[0].lat,
      maxLat: inCity[0].lat,
      minLng: inCity[0].lng,
      maxLng: inCity[0].lng,
    },
  );
}
