/**
 * Shared, dependency-free helpers for the data validators
 * (validate-places.mjs, validate-competitions.mjs) and the freshness check
 * (check-data-freshness.mjs). Node standard library only, see #194.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * True when `value` is a Google Maps link whose `q=` parameter is still the raw
 * `<lat>,<lng>` placeholder from the record-shape template (see #229).
 */
export function isLatLngPlaceholderGmapsLink(value) {
  if (typeof value !== "string") return false;
  try {
    const { searchParams } = new URL(value);
    const q = searchParams.get("q");
    return typeof q === "string" && q.trim() === "lat,lng";
  } catch {
    return false;
  }
}

const GMAPS_Q_COORDS_RE = /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:&|$)/;

/**
 * `{ lat, lng }` for a Google Maps link of the `?q=<lat>,<lng>` form, or `null` for any
 * other form (`cid=`, `maps.app.goo.gl`, a `q=` that is a place name), see #283.
 */
export function gmapsLinkCoordinates(link) {
  if (typeof link !== "string") return null;
  const match = GMAPS_Q_COORDS_RE.exec(link);
  if (!match) return null;
  return { lat: Number(match[1]), lng: Number(match[2]) };
}

/** Lowercase, diacritics folded, punctuation removed, whitespace collapsed. */
export function normalizePlaceName(name) {
  if (typeof name !== "string") return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Groups of records that share a `city` and a normalised `name`. Each record is
 * `{ file, ...place }`; returns arrays of two or more records. Spans files on purpose,
 * since parallel batches added the same place under different city prefixes (see #285).
 */
export function findSameNamePlaces(records) {
  const groups = new Map();
  for (const record of records) {
    const name = normalizePlaceName(record.name);
    if (!record.city || !name) continue;
    const key = `${record.city}|${name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

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
