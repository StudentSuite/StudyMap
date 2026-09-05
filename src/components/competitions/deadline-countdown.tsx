"use client";

import { useEffect, useState } from "react";

import { nextDate } from "@/lib/competitions";
import type { Competition, CompetitionCountry, CompetitionDateEntry } from "@/lib/types";

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

/** Formats a "YYYY-MM-DD" date as e.g. "August 21, 2026". */
export function formatCompetitionDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

// Parses a "UTC", "UTC+5", "UTC-4", or "UTC+5:30"-style offset string into
// minutes (negative when behind UTC). Unrecognised input is treated as UTC
// rather than throwing, since a bad timezone string shouldn't crash a card.
function parseTimezoneOffsetMinutes(timezone: string): number {
  const match = /^UTC([+-]\d{1,2})(?::(\d{2}))?$/.exec(timezone.trim());
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const sign = hours < 0 ? -1 : 1;
  return hours * 60 + sign * minutes;
}

// A "date"-only field with a "type: deadline" reads like "due by the end of
// this day, in this timezone" to a student, so the target instant is that
// day's 23:59:59 in the record's own offset, not midnight UTC.
function endOfDayInstant(dateIso: string, timezone: string): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  const offsetMinutes = parseTimezoneOffsetMinutes(timezone);
  const localAsUtcMs = Date.UTC(year, month - 1, day, 23, 59, 59);
  return new Date(localAsUtcMs - offsetMinutes * 60_000);
}

/** Formats a remaining duration as "Xd Xh Xm Xs" (or "X months" beyond a year). */
export function formatDuration(ms: number): string {
  if (ms <= 0) return "0h 0m 0s";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);

  if (days > 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days >= 1) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
}

function lastKnownDate(dates: CompetitionDateEntry[]): CompetitionDateEntry | undefined {
  return dates.reduce<CompetitionDateEntry | undefined>(
    (latest, date) => (!latest || date.date > latest.date ? date : latest),
    undefined,
  );
}

export interface DeadlineCountdownProps {
  competition: Competition;
  country?: CompetitionCountry;
  /**
   * Reference time for picking "the next date". Supplied by the server
   * (e.g. the page component) so the pre-mount render is identical on the
   * server and on the client's first paint — a fresh `new Date()` on each
   * side would risk selecting a different "next" date right at a rollover
   * and would always disagree by however long the request took.
   */
  now: Date;
  className?: string;
}

/**
 * Renders a competition's next milestone as a status label (from the data,
 * not a hardcoded string) plus a live countdown.
 *
 * The countdown itself only appears after mount: server-rendering a ticking
 * clock is a guaranteed hydration mismatch (the server renders one second,
 * the client hydrates on another), so before mount this renders only the
 * static label and formatted date, and the ticking numerals are gated
 * behind a `mounted` flag with their own client-only clock.
 */
export function DeadlineCountdown({
  competition,
  country,
  now,
  className,
}: DeadlineCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [liveNow, setLiveNow] = useState(now);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    setLiveNow(new Date());
    /* eslint-enable react-hooks/set-state-in-effect */
    const interval = setInterval(() => setLiveNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = nextDate(competition, now, country);

  if (!upcoming) {
    const last = lastKnownDate(competition.dates);
    if (!last) return null;
    return (
      <div className={className}>
        <p className="text-sm font-medium text-foreground">{last.label}</p>
        <p className="text-sm text-muted-foreground">
          {formatCompetitionDate(last.date)}
        </p>
      </div>
    );
  }

  const target = endOfDayInstant(upcoming.date, upcoming.timezone ?? "UTC");
  const msRemaining = target.getTime() - liveNow.getTime();
  // Once mounted and time has actually run out (e.g. the tab was left open
  // across the deadline), stop showing a countdown rather than go negative.
  const showCountdown = mounted && msRemaining > 0;

  return (
    <div className={className}>
      <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
        {upcoming.label}
        {upcoming.estimated && (
          <span
            className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
            title="This date is our best estimate, not yet confirmed for this cycle"
          >
            approximate
          </span>
        )}
      </p>
      <p className="text-sm text-muted-foreground">
        {formatCompetitionDate(upcoming.date)}
        {upcoming.timezone && <span> ({upcoming.timezone})</span>}
        {mounted && msRemaining <= 0 && " (closed)"}
      </p>
      {showCountdown && (
        // No transition/animation classes on the ticking numerals: they
        // change every second regardless of prefers-reduced-motion, but
        // nothing here animates that change, so reduced-motion users see a
        // plain re-render, not a flip/slide effect.
        <p className="font-mono text-base tabular-nums" aria-live="off">
          {formatDuration(msRemaining)}
        </p>
      )}
    </div>
  );
}
