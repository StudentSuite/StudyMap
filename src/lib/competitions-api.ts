import { filterCompetitions } from "@/lib/competitions";
import {
  COMPETITION_CATEGORIES,
  COMPETITION_COUNTRIES,
  COMPETITION_FORMATS,
  COMPETITION_PARTICIPATION_TYPES,
} from "@/lib/types";
import type {
  Competition,
  CompetitionCategory,
  CompetitionCountry,
  CompetitionFormat,
  CompetitionParticipation,
} from "@/lib/types";

/**
 * Public API contract for GET /api/competitions. Kept separate from the
 * route handler so the whole contract (filtering, validation, pagination)
 * is unit-testable without HTTP - mirrors src/lib/places-api.ts exactly.
 *
 * The dataset changes a few times a week at most, same cadence as places,
 * so the same reasoning applies: a generous but bounded default, a hard
 * cap, offset for deep paging. The numbers are smaller because the
 * competitions dataset itself is (currently ~50 records vs. ~300+ places);
 * the default is deliberately at least the current dataset size, so a
 * plain `GET /api/competitions` with no params returns everything today.
 */
export const COMPETITIONS_API_LIMITS = {
  defaultLimit: 50,
  maxLimit: 200,
} as const;

export interface CompetitionsQuery {
  category?: CompetitionCategory;
  format?: CompetitionFormat;
  participation?: CompetitionParticipation;
  region?: string;
  /**
   * Unlike places (where a `country` filter is rejected outright, see
   * src/lib/places-api.ts:91-104, because the places schema has no country
   * field), competitions genuinely carry one: `country_tracks[].country`.
   * This is a real, meaningful filter here, not copied over by mistake.
   */
  country?: CompetitionCountry;
  freeOnly?: boolean;
  age?: number;
  deadlineBefore?: string;
  limit: number;
  offset: number;
}

export interface CompetitionsQueryResult {
  /** Competitions matching the filters, sliced by limit/offset. */
  data: Competition[];
  /** Matches before pagination, so consumers can page to the end. */
  total: number;
  limit: number;
  offset: number;
}

export type CompetitionsQueryParse =
  { ok: true; query: CompetitionsQuery } | { ok: false; error: string };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNonNegativeInteger(value: string): boolean {
  return /^\d+$/.test(value);
}

const REPEATABLE_ERROR_PARAMS = [
  "category",
  "format",
  "participation",
  "region",
  "country",
  "fee",
  "age",
  "deadline_before",
  "limit",
  "offset",
] as const;

/**
 * Parse and validate the query string of GET /api/competitions.
 *
 * Strict by design, matching src/lib/places-api.ts's parsePlacesQuery:
 * unknown categories, formats, participation types, countries, or fee
 * values are 400s with a message, never silently ignored. The one
 * deliberate leniency is `limit`: values above the hard cap are clamped
 * rather than rejected.
 */
export function parseCompetitionsQuery(params: URLSearchParams): CompetitionsQueryParse {
  for (const name of REPEATABLE_ERROR_PARAMS) {
    if (params.getAll(name).length > 1) {
      return { ok: false, error: `${name} must be given at most once` };
    }
  }

  const rawCategory = params.get("category");
  let category: CompetitionCategory | undefined;
  if (rawCategory !== null) {
    if (!(COMPETITION_CATEGORIES as readonly string[]).includes(rawCategory)) {
      return {
        ok: false,
        error: `unknown category "${rawCategory}"; expected one of ${COMPETITION_CATEGORIES.join(", ")}`,
      };
    }
    category = rawCategory as CompetitionCategory;
  }

  const rawFormat = params.get("format");
  let format: CompetitionFormat | undefined;
  if (rawFormat !== null) {
    if (!(COMPETITION_FORMATS as readonly string[]).includes(rawFormat)) {
      return {
        ok: false,
        error: `unknown format "${rawFormat}"; expected one of ${COMPETITION_FORMATS.join(", ")}`,
      };
    }
    format = rawFormat as CompetitionFormat;
  }

  const rawParticipation = params.get("participation");
  let participation: CompetitionParticipation | undefined;
  if (rawParticipation !== null) {
    if (
      !(COMPETITION_PARTICIPATION_TYPES as readonly string[]).includes(rawParticipation)
    ) {
      return {
        ok: false,
        error: `unknown participation "${rawParticipation}"; expected one of ${COMPETITION_PARTICIPATION_TYPES.join(", ")}`,
      };
    }
    participation = rawParticipation as CompetitionParticipation;
  }

  const rawRegion = params.get("region");
  let region: string | undefined;
  if (rawRegion !== null) {
    if (rawRegion.trim() === "") {
      return { ok: false, error: "region must not be empty" };
    }
    // region is free-form on the schema ("international" or an ISO-3166
    // alpha-2 code) rather than a fixed enum, so it is matched exactly as
    // stored - same as filterCompetitions() itself - not validated further.
    region = rawRegion;
  }

  const rawCountry = params.get("country");
  let country: CompetitionCountry | undefined;
  if (rawCountry !== null) {
    if (!(COMPETITION_COUNTRIES as readonly string[]).includes(rawCountry)) {
      return {
        ok: false,
        error: `unknown country "${rawCountry}"; expected one of ${COMPETITION_COUNTRIES.join(", ")}`,
      };
    }
    country = rawCountry as CompetitionCountry;
  }

  const rawFee = params.get("fee");
  let freeOnly: boolean | undefined;
  if (rawFee !== null) {
    if (rawFee !== "free") {
      return { ok: false, error: `unknown fee "${rawFee}"; expected "free"` };
    }
    freeOnly = true;
  }

  const rawAge = params.get("age");
  let age: number | undefined;
  if (rawAge !== null) {
    if (!isNonNegativeInteger(rawAge)) {
      return { ok: false, error: "age must be a non-negative integer" };
    }
    age = Number(rawAge);
  }

  const rawDeadlineBefore = params.get("deadline_before");
  let deadlineBefore: string | undefined;
  if (rawDeadlineBefore !== null) {
    if (!ISO_DATE_RE.test(rawDeadlineBefore)) {
      return { ok: false, error: "deadline_before must be an ISO date (YYYY-MM-DD)" };
    }
    deadlineBefore = rawDeadlineBefore;
  }

  const rawLimit = params.get("limit");
  let limit: number = COMPETITIONS_API_LIMITS.defaultLimit;
  if (rawLimit !== null) {
    if (!isNonNegativeInteger(rawLimit) || Number(rawLimit) === 0) {
      return { ok: false, error: "limit must be a positive integer" };
    }
    limit = Math.min(Number(rawLimit), COMPETITIONS_API_LIMITS.maxLimit);
  }

  const rawOffset = params.get("offset");
  let offset = 0;
  if (rawOffset !== null) {
    if (!isNonNegativeInteger(rawOffset)) {
      return { ok: false, error: "offset must be a non-negative integer" };
    }
    offset = Number(rawOffset);
  }

  return {
    ok: true,
    query: {
      category,
      format,
      participation,
      region,
      country,
      freeOnly,
      age,
      deadlineBefore,
      limit,
      offset,
    },
  };
}

/**
 * Apply the parsed filters and pagination. `total` counts matches before
 * slicing so consumers know the full result set size. Reuses
 * filterCompetitions() - the same filtering logic the /competitions browse
 * page runs client-side - rather than duplicating it, so the two can never
 * silently disagree about what a filter means.
 */
export function queryCompetitions(
  competitions: Competition[],
  {
    category,
    format,
    participation,
    region,
    country,
    freeOnly,
    age,
    deadlineBefore,
    limit,
    offset,
  }: CompetitionsQuery,
): CompetitionsQueryResult {
  const matches = filterCompetitions(competitions, {
    categories: category ? [category] : undefined,
    format,
    participation,
    region,
    feeMax: freeOnly ? 0 : undefined,
    age,
    deadlineBefore,
  }).filter(
    (competition) =>
      country === undefined ||
      (competition.country_tracks ?? []).some((track) => track.country === country),
  );

  return {
    data: matches.slice(offset, offset + limit),
    total: matches.length,
    limit,
    offset,
  };
}
