/**
 * StudyMap region + dataset config.
 *
 * Forking StudyMap for a different city or dataset? This is the one file to
 * change. Swap the imports below for your own `data/places/*.json`, and
 * adjust `center` / `defaultZoom` / `bounds` / `cities` to your region. No
 * other file needs to change; `src/lib/places.ts` reads from here.
 */
import type { Bounds } from "@/lib/places";
import type { City, Place } from "@/lib/types";

import airport from "./data/places/airport.json";
import bookShop from "./data/places/book_shop.json";
import stationery from "./data/places/stationery.json";
import examCentre from "./data/places/exam_centre.json";
import internetCafe from "./data/places/internet_cafe.json";
import library from "./data/places/library.json";
import impLocations from "./data/places/imp_locations.json";
import trainStation from "./data/places/train_station.json";

export interface StudyMapConfig {
  /** Initial map center, as [lat, lng]. */
  center: [number, number];
  /** Default zoom level for the initial map view. */
  defaultZoom: number;
  /** Valid coordinate bounds for this region, used for data validation and map fitting. */
  bounds: Bounds;
  /**
   * Preferred display order for the city filter. Any city present in the
   * data but missing here still shows, sorted alphabetically after these.
   */
  cities: City[];
  /** Every place pin StudyMap renders, merged from the data sources above. */
  places: Place[];
}

const studyMapConfig: StudyMapConfig = {
  center: [19.08, 72.95],
  defaultZoom: 11,
  bounds: {
    minLat: 18,
    maxLat: 20,
    minLng: 72,
    maxLng: 73,
  },
  cities: ["mumbai", "thane", "navi_mumbai"],
  places: [
    ...(airport as Place[]),
    ...(bookShop as Place[]),
    ...(stationery as Place[]),
    ...(examCentre as Place[]),
    ...(internetCafe as Place[]),
    ...(library as Place[]),
    ...(impLocations as Place[]),
    ...(trainStation as Place[]),
  ],
};

export default studyMapConfig;
