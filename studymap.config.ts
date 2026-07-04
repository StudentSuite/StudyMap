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
import library from "./data/places/library.json";
import otherPlaces from "./data/places/other_places.json";
import satCentre from "./data/places/sat_centre.json";
import foreignLangExamCentre from "./data/places/foreign_lang_exam_centre.json";
import govOffices from "./data/places/gov_offices.json";

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
    ...(library as Place[]),
    ...(otherPlaces as Place[]),
    ...(satCentre as Place[]),
    ...(foreignLangExamCentre as Place[]),
    ...(govOffices as Place[]),
  ],
};

export default studyMapConfig;
