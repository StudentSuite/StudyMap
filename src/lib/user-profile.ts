import { createClient } from "@/lib/supabase/client";
import { isMissingTableError } from "@/lib/utils";
import { COMPETITION_COUNTRIES, COMPETITION_COUNTRY_LABELS } from "@/lib/types";
import type { CompetitionCountry } from "@/lib/types";
import type { ExamBoard } from "@/lib/exam-dates";

/**
 * Supabase client for the private-data calls below. These only ever run for a
 * signed-in user, which is impossible without Supabase configured, so a null
 * client here means something is badly misconfigured - throw rather than guess.
 */
function requireClient() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

async function currentUserId(): Promise<string> {
  const supabase = requireClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export type OnboardingBoard =
  | "IB"
  | "IGCSE"
  | "CBSE"
  | "ICSE"
  | "A-Levels"
  | "AP"
  | "State board"
  | "Other";

export const ONBOARDING_BOARDS: { value: OnboardingBoard; label: string }[] = [
  { value: "IB", label: "IB" },
  { value: "IGCSE", label: "IGCSE" },
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "A-Levels", label: "A-Levels" },
  { value: "AP", label: "AP" },
  { value: "State board", label: "State board" },
  { value: "Other", label: "Other" },
];

export type OnboardingField = "STEM" | "Humanities" | "Commerce" | "Arts" | "Undecided";

export const ONBOARDING_FIELDS: { value: OnboardingField; label: string }[] = [
  { value: "STEM", label: "STEM" },
  { value: "Humanities", label: "Humanities" },
  { value: "Commerce", label: "Commerce" },
  { value: "Arts", label: "Arts" },
  { value: "Undecided", label: "Undecided" },
];

/** The 13 countries with a real competition pathway, plus a catch-all. */
export type OnboardingCountry = CompetitionCountry | "Other";

export const ONBOARDING_COUNTRIES: { value: OnboardingCountry; label: string }[] = [
  ...COMPETITION_COUNTRIES.map((country) => ({
    value: country as OnboardingCountry,
    label: COMPETITION_COUNTRY_LABELS[country],
  })),
  { value: "Other", label: "Other" },
];

export type OnboardingReferralSource =
  | "GitHub"
  | "Google"
  | "Instagram"
  | "Friend or school"
  | "Reddit"
  | "Other";

export const ONBOARDING_REFERRAL_SOURCES: {
  value: OnboardingReferralSource;
  label: string;
}[] = [
  { value: "GitHub", label: "GitHub" },
  { value: "Google", label: "Google" },
  { value: "Instagram", label: "Instagram" },
  { value: "Friend or school", label: "Friend or school" },
  { value: "Reddit", label: "Reddit" },
  { value: "Other", label: "Other" },
];

/** Current year through +6, matching "when are you graduating". */
export function graduationYearOptions(now: Date = new Date()): number[] {
  const start = now.getFullYear();
  return Array.from({ length: 7 }, (_, i) => start + i);
}

export interface UserProfileRow {
  user_id: string;
  graduation_year: number | null;
  board: OnboardingBoard | null;
  field: OnboardingField | null;
  country: OnboardingCountry | null;
  referral_source: OnboardingReferralSource | null;
  referral_other: string | null;
  /** Opaque bearer token behind the saved-competitions calendar feed (#210). */
  calendar_token: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInput {
  graduation_year?: number | null;
  board?: OnboardingBoard | null;
  field?: OnboardingField | null;
  country?: OnboardingCountry | null;
  referral_source?: OnboardingReferralSource | null;
  referral_other?: string | null;
}

export async function fetchUserProfile(): Promise<UserProfileRow | null> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * True once the user has been offered the questionnaire at all, whether they
 * answered every question or skipped straight through. Any row - even one
 * with every column still null - counts, because a blank row is written the
 * moment `/onboarding` is first visited (see `ensureProfileRow`). This is
 * what makes "skip" distinguishable from "never asked": both leave every
 * column null, but only "asked" leaves a row.
 *
 * Fails open (reports "seen") when the table doesn't exist yet, e.g. this
 * deployment hasn't run the #203 migration - onboarding must never block
 * sign-in.
 */
export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await fetchUserProfile()) !== null;
  } catch (err) {
    if (isMissingTableError(err)) return true;
    throw err;
  }
}

/** Creates a blank profile row if one doesn't already exist. Never overwrites an existing row. */
export async function ensureProfileRow(): Promise<UserProfileRow> {
  return saveProfileStep({});
}

/** Persists one step's answer(s), merging into any existing row. */
export async function saveProfileStep(
  patch: UserProfileInput,
): Promise<UserProfileRow> {
  const supabase = requireClient();
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      { user_id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * The signed-in user's calendar-feed token (#210), creating a blank
 * `user_profiles` row first if none exists yet. Deliberately independent of
 * onboarding completion or even having been offered it - a user who signed
 * in before this feature existed, or who skipped onboarding entirely, still
 * gets a token the first time anything asks for one.
 */
export async function fetchCalendarToken(): Promise<string> {
  const profile = await ensureProfileRow();
  return profile.calendar_token;
}

/**
 * Replaces the calendar-feed token with a fresh random one, invalidating
 * every previously issued feed URL. The old value is never re-derivable
 * from the new one - this is a full swap, not a rotation scheme with a
 * grace period.
 */
export async function rotateCalendarToken(): Promise<string> {
  const supabase = requireClient();
  const user_id = await currentUserId();
  const calendar_token = crypto.randomUUID();
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ calendar_token, updated_at: new Date().toISOString() })
    .eq("user_id", user_id)
    .select("calendar_token")
    .single();
  if (error) throw error;
  return data.calendar_token;
}

/**
 * The exam boards a questionnaire `board` answer should default the calendar
 * to. Only IB and IGCSE have a matching entry in `EXAM_EVENTS`
 * (`src/lib/exam-dates.ts`), so every other answer (CBSE, ICSE, A-Levels, AP,
 * State board, Other, or no answer at all) falls back to `null`, meaning
 * "show every board" - the calendar's current default. Guessing a board with
 * no real exam-date data behind it would be worse than showing everything.
 */
export function boardToExamBoards(board: OnboardingBoard | null): ExamBoard[] | null {
  if (board === "IB") return ["IB"];
  if (board === "IGCSE") return ["IGCSE"];
  return null;
}

/** A questionnaire `country` answer usable as a competition country default, or `null`. */
export function profileCompetitionCountry(
  country: OnboardingCountry | null,
): CompetitionCountry | null {
  if (country && (COMPETITION_COUNTRIES as readonly string[]).includes(country)) {
    return country as CompetitionCountry;
  }
  return null;
}
