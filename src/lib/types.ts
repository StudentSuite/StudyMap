export const PLACE_TYPES = [
  "library",
  "other_places",
  "airport",
  "sat_centre",
  "foreign_lang_exam_centre",
  "gov_offices",
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

/**
 * A place's city is a free-form slug (lowercase, underscore-separated,
 * e.g. "navi_mumbai", "new_delhi"). Not a fixed enum: contributors can add
 * places in any city, and the map's city picker is built from whatever
 * slugs are actually present in the dataset.
 */
export type City = string;

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  library: "Library",
  other_places: "Other places",
  airport: "Airport",
  sat_centre: "SAT centre",
  foreign_lang_exam_centre: "Foreign lang exam centre",
  gov_offices: "Government offices",
};

/** Turns a city slug into a display label, e.g. "navi_mumbai" -> "Navi Mumbai". */
export function humanizeCity(city: City): string {
  return city
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const COMPETITION_CATEGORIES = [
  "stem",
  "mathematics",
  "coding",
  "essay_writing",
  "creative_writing",
  "arts_design",
  "film_video",
  "business",
  "finance",
  "humanities",
  "history",
  "debate_mun",
  "research",
  "scholarship",
  "interdisciplinary",
] as const;

export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number];

export const COMPETITION_CATEGORY_LABELS: Record<CompetitionCategory, string> = {
  stem: "STEM",
  mathematics: "Mathematics",
  coding: "Coding",
  essay_writing: "Essay writing",
  creative_writing: "Creative writing",
  arts_design: "Arts & design",
  film_video: "Film & video",
  business: "Business",
  finance: "Finance",
  humanities: "Humanities",
  history: "History",
  debate_mun: "Debate & MUN",
  research: "Research",
  scholarship: "Scholarship",
  interdisciplinary: "Interdisciplinary",
};

export const COMPETITION_FORMATS = ["online", "in_person", "hybrid"] as const;

export type CompetitionFormat = (typeof COMPETITION_FORMATS)[number];

export const COMPETITION_FORMAT_LABELS: Record<CompetitionFormat, string> = {
  online: "Online",
  in_person: "In person",
  hybrid: "Hybrid",
};

export const COMPETITION_PARTICIPATION_TYPES = [
  "individual",
  "team",
  "individual_or_team",
] as const;

export type CompetitionParticipation = (typeof COMPETITION_PARTICIPATION_TYPES)[number];

export const COMPETITION_PARTICIPATION_LABELS: Record<CompetitionParticipation, string> =
  {
    individual: "Individual",
    team: "Team",
    individual_or_team: "Individual or team",
  };

export const COMPETITION_DATE_TYPES = [
  "registration_open",
  "registration_close",
  "deadline",
  "round",
  "results",
  "ceremony",
] as const;

export type CompetitionDateType = (typeof COMPETITION_DATE_TYPES)[number];

export const COMPETITION_COUNTRIES = [
  "IN",
  "US",
  "GB",
  "CA",
  "AU",
  "SG",
  "DE",
  "FR",
  "CN",
  "JP",
  "KR",
  "BR",
  "ZA",
] as const;

export type CompetitionCountry = (typeof COMPETITION_COUNTRIES)[number];

/** An entry recorded directly on a competition's own `dates` array. */
export interface CompetitionDateEntry {
  label: string;
  date: string;
  type: CompetitionDateType;
  timezone: string;
  estimated: boolean;
  source_url: string;
}

/** One milestone in a country's qualifying pathway into a competition. */
export interface CompetitionCountryStage {
  name: string;
  date: string;
  estimated: boolean;
  source_url: string;
}

/** A real national qualifying pathway into a competition, for one country. */
export interface CompetitionCountryTrack {
  country: CompetitionCountry;
  official_url: string;
  stages: CompetitionCountryStage[];
}

export interface CompetitionFee {
  amount: number;
  currency: string;
}

/**
 * A student competition record. This is the entire committed record shape,
 * mirroring `Place` (see data/competitions.schema.json and
 * data/competitions/CONTRIBUTING.md).
 */
export interface Competition {
  id: string;
  name: string;
  organizer: string;
  organizer_url: string;
  category: CompetitionCategory;
  subjects: string[];
  description: string;
  format: CompetitionFormat;
  age_min: number;
  age_max: number;
  participation: CompetitionParticipation;
  /** `"international"`, or an ISO-3166 alpha-2 country code, e.g. "US". */
  region: string;
  fee: CompetitionFee;
  prize: string;
  official_url: string;
  cycle_year: number;
  dates: CompetitionDateEntry[];
  /** Optional. Only present when a real national qualifying pathway exists. */
  country_tracks?: CompetitionCountryTrack[];
  added_by: string;
  /** Optional proof a contributor re-checked this record; verified competitions show a badge. */
  verified?: Verified;
  /** ISO date this record should be reconfirmed by. */
  valid_till?: string;
}

/**
 * A single flattened, comparable date for a competition: either one of its
 * own `dates[]` entries, or (when a `country` is requested from
 * `upcomingDates`/`nextDate`) one of that country's `country_tracks` stages.
 * Stage-derived entries carry `country` so callers can tell them apart from
 * the competition's own dates and filter by country.
 */
export interface CompetitionDate {
  label: string;
  date: string;
  type?: CompetitionDateType;
  timezone?: string;
  estimated: boolean;
  source_url: string;
  country?: CompetitionCountry;
}

/** Who verified a place and when, for the optional `verified` badge. */
export interface Verified {
  /** GitHub username of the verifier. */
  by: string;
  /** ISO date (YYYY-MM-DD) the place was last verified. */
  on: string;
}

/**
 * A public place pin. This is the entire committed record shape.
 * Proof of quality (source citation, Google Maps rating and review count)
 * lives in the contribution PR, not in this dataset; the `verified` field is
 * the one exception (#126).
 */
export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  city: City;
  lat: number;
  lng: number;
  address?: string;
  gmaps_link: string;
  added_by: string;
  /** Optional proof a contributor re-checked this place; verified places show a badge. */
  verified?: Verified;
  /** Exam this place is a centre for, e.g. "SAT", "Goethe-Zertifikat (A1-C2)". */
  exam?: string;
  /** ISO date the centre's exam/address validity should be reconfirmed by. */
  valid_till?: string;
}
