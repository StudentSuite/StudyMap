import type {
  Competition,
  CompetitionCategory,
  CompetitionCountry,
  CompetitionDate,
  CompetitionFormat,
  CompetitionParticipation,
} from "@/lib/types";
import { COMPETITION_CATEGORIES } from "@/lib/types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Formats a "YYYY-MM-DD" date as e.g. "August 21, 2026". Lives here (a
 * plain module, not "use client") so both client components (the
 * countdown) and server components (the detail page) can call it.
 */
export function formatCompetitionDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

import artsDesign from "../../data/competitions/arts_design.json";
import business from "../../data/competitions/business.json";
import coding from "../../data/competitions/coding.json";
import creativeWriting from "../../data/competitions/creative_writing.json";
import debateMun from "../../data/competitions/debate_mun.json";
import essayWriting from "../../data/competitions/essay_writing.json";
import filmVideo from "../../data/competitions/film_video.json";
import finance from "../../data/competitions/finance.json";
import history from "../../data/competitions/history.json";
import humanities from "../../data/competitions/humanities.json";
import interdisciplinary from "../../data/competitions/interdisciplinary.json";
import mathematics from "../../data/competitions/mathematics.json";
import research from "../../data/competitions/research.json";
import scholarship from "../../data/competitions/scholarship.json";
import stem from "../../data/competitions/stem.json";

const ALL_COMPETITIONS: Competition[] = [
  ...(artsDesign as Competition[]),
  ...(business as Competition[]),
  ...(coding as Competition[]),
  ...(creativeWriting as Competition[]),
  ...(debateMun as Competition[]),
  ...(essayWriting as Competition[]),
  ...(filmVideo as Competition[]),
  ...(finance as Competition[]),
  ...(history as Competition[]),
  ...(humanities as Competition[]),
  ...(interdisciplinary as Competition[]),
  ...(mathematics as Competition[]),
  ...(research as Competition[]),
  ...(scholarship as Competition[]),
  ...(stem as Competition[]),
];

/** Every competition record, sourced from `data/competitions/<category>.json`. */
export function getCompetitions(): Competition[] {
  return ALL_COMPETITIONS;
}

export interface CompetitionFilters {
  categories?: CompetitionCategory[];
  format?: CompetitionFormat;
  region?: string;
  participation?: CompetitionParticipation;
  /** Only competitions with a fee at or below this amount (in the record's own currency). */
  feeMax?: number;
  /** Only competitions whose age range includes this age. */
  age?: number;
  /** Only competitions with a `deadline`-type date on or before this ISO date. */
  deadlineBefore?: string;
  query?: string;
}

export function filterCompetitions(
  competitions: Competition[],
  filters: CompetitionFilters = {},
): Competition[] {
  const q = filters.query?.trim().toLowerCase() ?? "";

  return competitions.filter((competition) => {
    if (
      filters.categories &&
      filters.categories.length > 0 &&
      !filters.categories.includes(competition.category)
    ) {
      return false;
    }
    if (filters.format && competition.format !== filters.format) {
      return false;
    }
    if (filters.region && competition.region !== filters.region) {
      return false;
    }
    if (filters.participation && competition.participation !== filters.participation) {
      return false;
    }
    if (filters.feeMax !== undefined && competition.fee.amount > filters.feeMax) {
      return false;
    }
    if (
      filters.age !== undefined &&
      (filters.age < competition.age_min || filters.age > competition.age_max)
    ) {
      return false;
    }
    if (
      filters.deadlineBefore !== undefined &&
      !competition.dates.some(
        (date) => date.type === "deadline" && date.date <= filters.deadlineBefore!,
      )
    ) {
      return false;
    }
    if (q) {
      const subjectsNorm = competition.subjects.join(" ").toLowerCase();
      if (
        !competition.name.toLowerCase().includes(q) &&
        !competition.organizer.toLowerCase().includes(q) &&
        !subjectsNorm.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}

/** Every category present in `getCompetitions()`, in `COMPETITION_CATEGORIES` order. */
export function getCategories(): CompetitionCategory[] {
  const present = new Set(getCompetitions().map((competition) => competition.category));
  return COMPETITION_CATEGORIES.filter((category) => present.has(category));
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Every date on `competition` that is today or later, flattened into one
 * comparable, ascending-sorted list.
 *
 * Always includes the competition's own `dates[]`. When `country` is given,
 * also includes that country's `country_tracks` stages (tagged with
 * `country` so callers can tell them apart); country stages are omitted
 * entirely when no country is requested.
 */
export function upcomingDates(
  competition: Competition,
  now: Date,
  country?: CompetitionCountry,
): CompetitionDate[] {
  const today = isoDate(now);
  const flattened: CompetitionDate[] = competition.dates.map((date) => ({
    label: date.label,
    date: date.date,
    type: date.type,
    timezone: date.timezone,
    estimated: date.estimated,
    source_url: date.source_url,
  }));

  if (country) {
    const track = competition.country_tracks?.find((t) => t.country === country);
    if (track) {
      for (const stage of track.stages) {
        flattened.push({
          label: stage.name,
          date: stage.date,
          estimated: stage.estimated,
          source_url: stage.source_url,
          country: track.country,
        });
      }
    }
  }

  return flattened
    .filter((date) => date.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** The soonest upcoming date on `competition`, or `undefined` if none remain. */
export function nextDate(
  competition: Competition,
  now: Date,
  country?: CompetitionCountry,
): CompetitionDate | undefined {
  return upcomingDates(competition, now, country)[0];
}

/**
 * Sorts by soonest upcoming date (ascending). Competitions with no future
 * date at all sort last, in their original relative order.
 */
export function sortByNextDate(competitions: Competition[], now: Date): Competition[] {
  return [...competitions].sort((a, b) => {
    const dateA = nextDate(a, now)?.date;
    const dateB = nextDate(b, now)?.date;
    if (dateA === undefined && dateB === undefined) return 0;
    if (dateA === undefined) return 1;
    if (dateB === undefined) return -1;
    return dateA.localeCompare(dateB);
  });
}
