/** Approximate centre of the Mumbai Metropolitan Region, used as the initial map position. */
export const MAP_CENTER: [number, number] = [19.08, 72.95];

/** Default zoom level for the MMR map view. */
export const DEFAULT_ZOOM = 11;

/**
 * Valid coordinate bounds for the Mumbai Metropolitan Region.
 * Used for data validation and will anchor the config-driven region work.
 */
export const REGION_BOUNDS = {
  minLat: 18,
  maxLat: 20,
  minLng: 72,
  maxLng: 73,
} as const;
