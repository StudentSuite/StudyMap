import type {
  CompetitionCategory,
  CompetitionFormat,
  CompetitionParticipation,
} from "@/lib/types";

/** "next 30 days", "next 90 days", or "this cycle" (the competition's own recorded cycle_year). */
export type DeadlineWindow = "30" | "90" | "cycle";

/** Active competitions filters, mirrored into the URL query for shareable links. */
export interface CompetitionFilterState {
  categories: CompetitionCategory[];
  format: CompetitionFormat | null;
  participation: CompetitionParticipation | null;
  region: string | null;
  freeOnly: boolean;
  age: number | null;
  deadlineWindow: DeadlineWindow | null;
  query: string;
}

export const EMPTY_COMPETITION_FILTERS: CompetitionFilterState = {
  categories: [],
  format: null,
  participation: null,
  region: null,
  freeOnly: false,
  age: null,
  deadlineWindow: null,
  query: "",
};

/** Number of active filters shown in the panel (everything except category chips and search). */
export function activeFilterCount(filters: CompetitionFilterState): number {
  let count = 0;
  if (filters.format) count++;
  if (filters.participation) count++;
  if (filters.region) count++;
  if (filters.freeOnly) count++;
  if (filters.age !== null) count++;
  if (filters.deadlineWindow) count++;
  return count;
}
