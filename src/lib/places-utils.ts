import type { City, Place, PlaceType } from "@/lib/types";
import { foldText } from "@/lib/utils";

/**
 * Pure helpers over a places array. Kept free of `studymap.config` so client
 * components can import them without bundling the whole dataset.
 */
export function filterPlaces(
  places: Place[],
  opts: {
    types?: PlaceType[];
    city?: City | null;
    country?: string | null;
    query?: string;
  },
): Place[] {
  const q = foldText(opts.query?.trim() ?? "");
  return places.filter((place) => {
    if (opts.types && opts.types.length > 0 && !opts.types.includes(place.type)) {
      return false;
    }
    if (opts.city && place.city !== opts.city) {
      return false;
    }
    if (opts.country && place.country !== opts.country) {
      return false;
    }
    if (q) {
      const cityNorm = place.city.replace(/_/g, " ");
      if (!foldText(place.name).includes(q) && !cityNorm.includes(q)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Every distinct city slug present in `places`, ordered by `preferredOrder`
 * with any city not in that list appended alphabetically after.
 */
export function getCities(places: Place[], preferredOrder: readonly City[] = []): City[] {
  const present = new Set(places.map((place) => place.city));
  const ordered = preferredOrder.filter((city) => present.has(city));
  const rest = Array.from(present)
    .filter((city) => !preferredOrder.includes(city))
    .sort();
  return [...ordered, ...rest];
}

/** Display name for an ISO 3166-1 alpha-2 code ("IN" -> "India"); the code itself if unknown. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Every distinct country code present in `places`, sorted by display name. */
export function getCountries(places: Place[]): string[] {
  const present = new Set<string>();
  for (const place of places) if (place.country) present.add(place.country);
  return Array.from(present).sort((a, b) => countryName(a).localeCompare(countryName(b)));
}

/** The cities of `cities` that have at least one place in `country`, keeping their order. */
export function citiesInCountry(
  places: Place[],
  cities: readonly City[],
  country: string,
): City[] {
  const present = new Set(
    places.filter((place) => place.country === country).map((place) => place.city),
  );
  return cities.filter((city) => present.has(city));
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
