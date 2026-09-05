import type {
  CompetitionFilterState,
  DeadlineWindow,
} from "@/components/competitions/filters";
import {
  COMPETITION_CATEGORIES,
  COMPETITION_FORMATS,
  COMPETITION_PARTICIPATION_TYPES,
} from "@/lib/types";
import type {
  CompetitionCategory,
  CompetitionFormat,
  CompetitionParticipation,
} from "@/lib/types";

const CATEGORY_SET = new Set<string>(COMPETITION_CATEGORIES);
const FORMAT_SET = new Set<string>(COMPETITION_FORMATS);
const PARTICIPATION_SET = new Set<string>(COMPETITION_PARTICIPATION_TYPES);
const DEADLINE_WINDOW_SET = new Set(["30", "90", "cycle"]);

function parseList(raw: string | null, allowed: Set<string>): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => allowed.has(value));
}

function parseEnum<T extends string>(raw: string | null, allowed: Set<string>): T | null {
  return raw && allowed.has(raw) ? (raw as T) : null;
}

function parseAge(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 99) return null;
  return value;
}

/** Read competition filter state out of a URL query string ("" or "?..."). */
export function parseCompetitionFilters(search: string): CompetitionFilterState {
  const params = new URLSearchParams(search);
  return {
    categories: parseList(
      params.get("categories"),
      CATEGORY_SET,
    ) as CompetitionCategory[],
    format: parseEnum<CompetitionFormat>(params.get("format"), FORMAT_SET),
    participation: parseEnum<CompetitionParticipation>(
      params.get("participation"),
      PARTICIPATION_SET,
    ),
    region: params.get("region")?.trim() || null,
    freeOnly: params.get("free") === "1",
    age: parseAge(params.get("age")),
    deadlineWindow: parseEnum<DeadlineWindow>(
      params.get("deadline"),
      DEADLINE_WINDOW_SET,
    ),
    query: params.get("q") ?? "",
  };
}

/** Serialise filter state to a query string ("" when everything is at its default). */
export function competitionFiltersToSearch(filters: CompetitionFilterState): string {
  const params = new URLSearchParams();
  if (filters.categories.length) params.set("categories", filters.categories.join(","));
  if (filters.format) params.set("format", filters.format);
  if (filters.participation) params.set("participation", filters.participation);
  if (filters.region) params.set("region", filters.region);
  if (filters.freeOnly) params.set("free", "1");
  if (filters.age !== null) params.set("age", String(filters.age));
  if (filters.deadlineWindow) params.set("deadline", filters.deadlineWindow);
  if (filters.query) params.set("q", filters.query);
  const query = params.toString();
  return query ? `?${query}` : "";
}
