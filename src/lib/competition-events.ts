import type { Competition, CompetitionCountry } from "@/lib/types";

/** One competition milestone flattened into a calendar-friendly shape. */
export interface CompetitionEvent {
  id: string;
  competitionId: string;
  competitionName: string;
  label: string;
  date: string;
  estimated: boolean;
  sourceUrl: string;
  /** Present only for a country_tracks stage, never for the competition's own dates[]. */
  country?: CompetitionCountry;
}

/**
 * Flattens `competitions` into calendar events: every entry in each
 * competition's own `dates[]`, plus (only when `country` is given) that
 * country's `country_tracks` stages. Mirrors how src/lib/competitions.ts's
 * upcomingDates() flattens the same two sources for a single competition,
 * but across many competitions at once and without a "future only" filter,
 * since the calendar shows past and future months alike.
 */
export function competitionEvents(
  competitions: Competition[],
  country?: CompetitionCountry,
): CompetitionEvent[] {
  const events: CompetitionEvent[] = [];

  for (const competition of competitions) {
    competition.dates.forEach((date, index) => {
      events.push({
        id: `${competition.id}-date-${index}`,
        competitionId: competition.id,
        competitionName: competition.name,
        label: date.label,
        date: date.date,
        estimated: date.estimated,
        sourceUrl: date.source_url,
      });
    });

    if (country) {
      const track = competition.country_tracks?.find((t) => t.country === country);
      track?.stages.forEach((stage, index) => {
        events.push({
          id: `${competition.id}-${country}-stage-${index}`,
          competitionId: competition.id,
          competitionName: competition.name,
          label: stage.name,
          date: stage.date,
          estimated: stage.estimated,
          sourceUrl: stage.source_url,
          country,
        });
      });
    }
  }

  return events;
}

/** Events whose date falls within the given calendar month (0-indexed, like `Date#getMonth`). */
export function competitionEventsInMonth(
  events: CompetitionEvent[],
  year: number,
  month: number,
): CompetitionEvent[] {
  return events.filter((event) => {
    const date = new Date(`${event.date}T00:00:00`);
    return date.getFullYear() === year && date.getMonth() === month;
  });
}

/**
 * Competitions relevant to `country`: open internationally, based in that
 * country, or carrying a real qualifier pathway for it. Used so a visitor
 * (signed out, or signed in with no saves) never sees an empty calendar,
 * without dropping all ~50 competitions x ~4 dates on the grid at once.
 */
export function competitionsForCountry(
  competitions: Competition[],
  country: CompetitionCountry,
): Competition[] {
  return competitions.filter(
    (competition) =>
      competition.region === "international" ||
      competition.region === country ||
      (competition.country_tracks ?? []).some((track) => track.country === country),
  );
}
