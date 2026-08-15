import type { CityPage } from "@/lib/city-pages";
import { placesByType } from "@/lib/city-pages";
import { humanizeCity, PLACE_TYPE_LABELS } from "@/lib/types";

export interface OgCount {
  label: string;
  count: number;
}

export interface OgCitySummary {
  /** Display name, e.g. "Navi Mumbai". */
  name: string;
  /** Total places in the city. */
  total: number;
  /** The city's categories by size, capped for the card. */
  counts: OgCount[];
  /** How many categories were left off the card. */
  more: number;
}

/** Most categories an OG card shows before falling back to "+N more". */
export const MAX_OG_COUNT_ROWS = 4;

/**
 * What a city's Open Graph card should say: the display name, the total
 * place count, and the biggest categories (most places first, ties in
 * canonical order). Pure and deterministic so the card is unit-testable.
 */
export function ogCitySummary(page: CityPage): OgCitySummary {
  const grouped = placesByType(page.places);
  const bySize = grouped
    .slice()
    .sort((a, b) => b[1].length - a[1].length);
  const shown = bySize.slice(0, MAX_OG_COUNT_ROWS);
  return {
    name: humanizeCity(page.city),
    total: page.places.length,
    counts: shown.map(([type, places]) => ({
      label: PLACE_TYPE_LABELS[type],
      count: places.length,
    })),
    more: Math.max(0, grouped.length - MAX_OG_COUNT_ROWS),
  };
}
