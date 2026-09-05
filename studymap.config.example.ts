/**
 * Example StudyMap config for a fresh fork.
 *
 * To run StudyMap for your own city with the placeholder sample dataset:
 *   1. cp studymap.config.example.ts studymap.config.ts
 *   2. Replace the imports below and every entry in data/places.sample/
 *      with your own data, or start adding real files under data/places/
 *      per CONTRIBUTING.md and import those instead.
 *   3. Set center / defaultZoom / cities to your region.
 */
import type { City, Place } from "@/lib/types";
import type { StudyMapConfig } from "./studymap.config";

import library from "./data/places.sample/library.json";
import bookShop from "./data/places.sample/book_shop.json";

const cities: City[] = ["example_city"];

const studyMapConfig: StudyMapConfig = {
  center: [0, 0],
  defaultZoom: 12,
  cities,
  places: [...(library as Place[]), ...(bookShop as Place[])],
};

export default studyMapConfig;
