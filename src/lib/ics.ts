import { site } from "@/lib/site";
import type { Competition } from "@/lib/types";

const CRLF = "\r\n";

/** RFC 5545 §3.3.11: backslash, comma, semicolon and newline all need escaping in TEXT values. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * RFC 5545 §3.1: content lines longer than 75 octets must be "folded"
 * (split with a CRLF followed by a single leading space, which the
 * continuation is expected to strip on unfolding). Splitting mid-multibyte
 * character is out of scope here - competition titles are the only
 * candidate for genuinely long lines, and this is safe for plain ASCII/
 * single-byte-per-char content, which covers everything in this dataset.
 */
function foldIcsLine(line: string): string {
  const MAX_LINE_LENGTH = 75;
  if (line.length <= MAX_LINE_LENGTH) return line;

  const chunks: string[] = [];
  let rest = line;
  while (rest.length > MAX_LINE_LENGTH) {
    chunks.push(rest.slice(0, MAX_LINE_LENGTH));
    rest = rest.slice(MAX_LINE_LENGTH);
  }
  chunks.push(rest);
  return chunks.join(CRLF + " ");
}

/** "YYYY-MM-DD" -> "YYYYMMDD", the VALUE=DATE form RFC 5545 uses for all-day events. */
function formatIcsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** The current instant as a UTC "YYYYMMDDTHHMMSSZ" DTSTAMP value. */
function formatIcsDateTimeUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * Builds the iCalendar (RFC 5545) text for a saved-competitions calendar
 * feed: one all-day VEVENT per competition per entry in its own `dates[]`
 * (registration, deadlines, rounds, results, ceremony - whatever the
 * record carries). Country-track stages are deliberately out of scope;
 * the saves a user actually made only ever concern a competition's own
 * dates, not every country's qualifying pathway.
 *
 * Pure and deterministic given `generatedAt`, so it's unit-testable
 * without a server or a real clock.
 */
export function competitionsIcs(competitions: Competition[], generatedAt: Date): string {
  const dtstamp = formatIcsDateTimeUtc(generatedAt);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudyMap//Saved Competitions//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:StudyMap: Saved Competitions",
  ];

  for (const competition of competitions) {
    competition.dates.forEach((date, index) => {
      const title = date.estimated
        ? `${competition.name}: ${date.label} (approximate)`
        : `${competition.name}: ${date.label}`;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${competition.id}-date-${index}@studyymap.com`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${formatIcsDate(date.date)}`,
        `SUMMARY:${escapeIcsText(title)}`,
        `DESCRIPTION:${escapeIcsText(competition.description)}`,
        `URL:${site.url}/competitions/${competition.id}`,
        "END:VEVENT",
      );
    });
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}
