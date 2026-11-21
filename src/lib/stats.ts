import { countryName } from "@/lib/places-utils";
import {
  COMPETITION_CATEGORY_LABELS,
  PLACE_TYPE_LABELS,
  humanizeCity,
  type Competition,
  type Place,
} from "@/lib/types";

/** One bar or table row: a group and how many records fall in it. */
export interface StatRow {
  key: string;
  label: string;
  count: number;
}

export type PlaceGrouping = "category" | "country" | "city";
export type CompetitionGrouping = "category" | "region";

export interface SiteStats {
  placeCount: number;
  cityCount: number;
  countryCount: number;
  placeCategoryCount: number;
  verifiedPlaceCount: number;
  competitionCount: number;
  competitionCategoryCount: number;
  /** Distinct `added_by` handles across places and competitions. */
  contributorCount: number;
  /** Each list is sorted by count, largest first, ties by label. */
  places: Record<PlaceGrouping, StatRow[]>;
  competitions: Record<CompetitionGrouping, StatRow[]>;
}

/** Counts records per key. Records without a key are skipped. */
function tally<T>(
  items: readonly T[],
  keyOf: (item: T) => string | undefined,
  labelOf: (key: string) => string,
): StatRow[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts, ([key, count]) => ({ key, label: labelOf(key), count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

function regionLabel(region: string): string {
  return region === "international" ? "International" : countryName(region);
}

/** Dataset-wide numbers for /stats. Pure: the caller passes in the datasets. */
export function computeStats(
  places: readonly Place[],
  competitions: readonly Competition[],
): SiteStats {
  const byCategory = tally(
    places,
    (p) => p.type,
    (key) => PLACE_TYPE_LABELS[key as keyof typeof PLACE_TYPE_LABELS] ?? key,
  );
  const byCountry = tally(places, (p) => p.country, countryName);
  const byCity = tally(places, (p) => p.city, humanizeCity);

  const competitionsByCategory = tally(
    competitions,
    (c) => c.category,
    (key) =>
      COMPETITION_CATEGORY_LABELS[key as keyof typeof COMPETITION_CATEGORY_LABELS] ?? key,
  );
  const competitionsByRegion = tally(competitions, (c) => c.region, regionLabel);

  const contributors = new Set<string>();
  for (const record of [...places, ...competitions]) {
    if (record.added_by) contributors.add(record.added_by);
  }

  return {
    placeCount: places.length,
    cityCount: byCity.length,
    countryCount: byCountry.length,
    placeCategoryCount: byCategory.length,
    verifiedPlaceCount: places.filter((p) => p.verified).length,
    competitionCount: competitions.length,
    competitionCategoryCount: competitionsByCategory.length,
    contributorCount: contributors.size,
    places: { category: byCategory, country: byCountry, city: byCity },
    competitions: { category: competitionsByCategory, region: competitionsByRegion },
  };
}
