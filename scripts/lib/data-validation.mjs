/**
 * Shared, dependency-free helpers for the data validators
 * (validate-places.mjs, validate-competitions.mjs) and the freshness check
 * (check-data-freshness.mjs). Node standard library only, see #194.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `value` is a "YYYY-MM-DD" string naming a real calendar date. */
export function isRealIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** True when `value` is a well-formed https:// URL. */
export function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** True when `value` is a well-formed http:// or https:// URL. */
export function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/** True when `value` is a string containing an em dash. House rule, see #193/#194. */
export function hasEmDash(value) {
  return typeof value === "string" && value.includes("—");
}

/** Accumulates and prints ERROR/WARN lines in the existing validators' format. */
export class Reporter {
  totalErrors = 0;
  totalWarnings = 0;

  err(loc, msg) {
    console.error(`  ERROR  ${loc}: ${msg}`);
    this.totalErrors++;
  }

  warn(loc, msg) {
    console.error(`  WARN   ${loc}: ${msg}`);
    this.totalWarnings++;
  }
}
