export interface HeatCell {
  lat: number;
  lng: number;
  /** Places in this cell. */
  count: number;
  /** count / the busiest cell's count, so 0 < intensity <= 1. */
  intensity: number;
}

interface HeatPoint {
  lat: number;
  lng: number;
}

/**
 * Bins points into a square grid of `cellPx` screen pixels and returns one
 * cell per occupied square, placed at the mean of its points. `project` maps
 * a lat/lng to pixel coordinates at the current zoom (Leaflet's
 * `map.project`), so the grid stays the same size on screen at every zoom
 * and the density re-forms as the user zooms in.
 */
export function densityCells(
  points: readonly HeatPoint[],
  project: (point: HeatPoint) => { x: number; y: number },
  cellPx: number,
): HeatCell[] {
  const bins = new Map<string, { lat: number; lng: number; count: number }>();

  for (const point of points) {
    const { x, y } = project(point);
    const key = `${Math.floor(x / cellPx)}:${Math.floor(y / cellPx)}`;
    const bin = bins.get(key);
    if (bin) {
      bin.lat += point.lat;
      bin.lng += point.lng;
      bin.count += 1;
    } else {
      bins.set(key, { lat: point.lat, lng: point.lng, count: 1 });
    }
  }

  let max = 0;
  for (const bin of bins.values()) max = Math.max(max, bin.count);

  return [...bins.values()].map((bin) => ({
    lat: bin.lat / bin.count,
    lng: bin.lng / bin.count,
    count: bin.count,
    intensity: bin.count / max,
  }));
}
