import { CalendarClock } from "lucide-react";

import type { Place } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Inside this many days of `valid_till`, the badge switches to the urgent "expires soon" styling. */
const EXPIRY_WARNING_DAYS = 60;

/** Human-readable form of an ISO date, e.g. "15 Nov 2026". Mirrors formatValidTill in pin-popup.tsx. */
function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Whole days from `now` to `iso` (negative once past). Null for an unparseable date, so callers can degrade gracefully instead of hiding. */
function daysUntil(iso: string, now: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const target = new Date(iso + "T00:00:00").getTime();
  return Math.ceil((target - now.getTime()) / 86_400_000);
}

export interface ExamCentreCountdownProps {
  place: Place;
  className?: string;
  /** The clock to compare against; tests pass a fixed date. Defaults to the current time. */
  now?: Date;
}

/**
 * Validity pill for exam-centre places (sat_centre / foreign_lang_exam_centre)
 * carrying a `valid_till` date. Absent entirely once the place has no
 * `valid_till`. Colour follows the same success/warning/destructive token
 * pattern as verified-badge.tsx: green while comfortably valid, amber inside
 * the 60-day window, red once the date has passed.
 */
export function ExamCentreCountdown({
  place,
  className,
  now = new Date(),
}: ExamCentreCountdownProps) {
  if (!place.valid_till) return null;

  const days = daysUntil(place.valid_till, now);
  const expired = days !== null && days < 0;
  const expiringSoon = days !== null && days >= 0 && days <= EXPIRY_WARNING_DAYS;

  const tone = expired
    ? "border-destructive/25 bg-destructive/10 text-destructive"
    : expiringSoon
      ? "border-warning/25 bg-warning/10 text-warning"
      : "border-success/25 bg-success/10 text-success";

  const label = expired
    ? `Expired ${formatDate(place.valid_till)}`
    : expiringSoon
      ? `Expires soon · ${formatDate(place.valid_till)}`
      : `Valid until ${formatDate(place.valid_till)}`;

  return (
    <span
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        tone,
        className,
      )}
    >
      <CalendarClock className="size-3" aria-hidden />
      {label}
    </span>
  );
}
