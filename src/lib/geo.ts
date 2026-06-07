import type { Place } from "@/lib/types";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceWithDistance extends Place {
  /** Distance from the reference point in kilometres. */
  distanceKm: number;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two coordinates in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Places sorted nearest first, each tagged with its distance from `origin`. */
export function placesByDistance(
  places: Place[],
  origin: LatLng,
): PlaceWithDistance[] {
  return places
    .map((place) => ({
      ...place,
      distanceKm: haversineKm(origin, { lat: place.lat, lng: place.lng }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Compact distance label, e.g. "450 m" or "3.2 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
