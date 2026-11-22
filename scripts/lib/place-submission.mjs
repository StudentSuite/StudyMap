/**
 * Shared pieces of the no-GitHub place submission pipeline (#264).
 *
 *   form  ->  POST /api/submit-place  ->  GitHub issue (label `place-submission`)
 *         ->  .github/workflows/place-submission.yml
 *         ->  scripts/process-place-submission.mjs  ->  pull request
 *
 * The route and the processing script both import this file, so the body the
 * route writes is exactly the body the script reads. Everything here is pure
 * and synchronous; network and file access live in the callers.
 */

import { normalizePlaceName } from "./data-validation.mjs";

export const SUBMISSION_LABEL = "place-submission";
export const SUBMISSION_MARKER = "<!-- studymap-place-submission:v1 -->";

export const PLACE_TYPES = [
  "library",
  "other_places",
  "airport",
  "sat_centre",
  "foreign_lang_exam_centre",
  "gov_offices",
];

const MAX = { name: 120, city: 60, contributor: 60, note: 500 };

// Same host rules as the place schema's gmaps_link pattern, plus the short
// links the "Share" button produces (which the processing script resolves).
const GMAPS_HOSTS_RE =
  /^https:\/\/(maps\.google\.com(\?|\/)|maps\.app\.goo\.gl\/.|www\.google\.com\/maps(\?|\/)|goo\.gl\/maps\/)/;

export function isAcceptedGoogleMapsLink(value) {
  return typeof value === "string" && GMAPS_HOSTS_RE.test(value.trim());
}

/** "Navi Mumbai" -> "navi_mumbai". Diacritics folded, anything else becomes "_". */
export function slugifyCity(input) {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Backticks would let a note close the JSON fence early; em dashes fail the
// dataset validator. Neither is worth rejecting a submission over.
function clean(value, max) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/`/g, "'")
    .replace(/—/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/**
 * Validates and normalises a raw submission. Returns
 * { ok: true, value } or { ok: false, error }.
 */
export function normalizeSubmission(raw) {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Submission must be an object." };
  }
  const name = clean(raw.name, MAX.name);
  const city = slugifyCity(clean(raw.city, MAX.city));
  const gmapsLink = typeof raw.gmapsLink === "string" ? raw.gmapsLink.trim() : "";
  const type = raw.type;

  if (!name) return { ok: false, error: "Place name is required." };
  if (!PLACE_TYPES.includes(type))
    return { ok: false, error: "Pick a valid place type." };
  if (!city) return { ok: false, error: "City is required." };
  if (gmapsLink.length > 600 || !isAcceptedGoogleMapsLink(gmapsLink)) {
    return { ok: false, error: "Enter a valid Google Maps link." };
  }

  return {
    ok: true,
    value: {
      name,
      type,
      city,
      gmapsLink,
      contributor: clean(raw.contributor, MAX.contributor),
      note: clean(raw.note, MAX.note),
    },
  };
}

/** The issue body: readable summary on top, machine-readable JSON underneath. */
export function buildIssueBody(sub) {
  return [
    SUBMISSION_MARKER,
    `**Place:** ${sub.name}`,
    `**Type:** ${sub.type}`,
    `**City:** ${sub.city}`,
    `**Google Maps link:** ${sub.gmapsLink}`,
    `**Contributor:** ${sub.contributor || "(anonymous)"}`,
    ...(sub.note ? [`**Note:** ${sub.note}`] : []),
    "",
    "Submitted through the StudyMap form. A workflow turns this into a pull request",
    "for review; nothing is merged without a maintainer.",
    "",
    "```json",
    JSON.stringify(sub),
    "```",
  ].join("\n");
}

/** Reads a submission back out of an issue body. Returns the normalised value or null. */
export function parseIssueBody(body) {
  if (typeof body !== "string" || !body.includes(SUBMISSION_MARKER)) return null;
  const match = /```json\s*([\s\S]*?)```/.exec(body);
  if (!match) return null;
  let raw;
  try {
    raw = JSON.parse(match[1]);
  } catch {
    return null;
  }
  const result = normalizeSubmission(raw);
  return result.ok ? result.value : null;
}

/** The type segment used in record ids. SAT centres use "sat" in the existing data. */
function idTypeSegment(type) {
  return type === "sat_centre" ? "sat" : type;
}

/**
 * Prefix for a city's ids, taken from what the dataset already uses
 * (`mum` for Mumbai, `thn` for Thane). Falls back to the first three letters
 * of the slug for a city with no records yet.
 */
const ID_PREFIX_RE = new RegExp(
  `^(.+?)-(?:${[...PLACE_TYPES.filter((t) => t !== "sat_centre"), "sat"].join("|")})-`,
);

export function cityIdPrefix(records, city, type) {
  const inCity = records.filter((r) => r.city === city && typeof r.id === "string");
  // Same-type records first: Mumbai uses `mum-` for libraries but `mumbai-` for SAT centres.
  const sameType = inCity.filter((r) => r.type === type);
  for (const r of [...sameType, ...inCity]) {
    const match = ID_PREFIX_RE.exec(r.id);
    if (match) return match[1];
  }
  return city.slice(0, 3);
}

/** Next free `<prefix>-<type>-<NN>` id for this city and type. */
export function nextPlaceId(records, city, type) {
  const prefix = cityIdPrefix(records, city, type);
  const head = `${prefix}-${idTypeSegment(type)}-`;
  const taken = new Set(records.map((r) => String(r.id)));
  let highest = 0;
  for (const id of taken) {
    if (id.startsWith(head)) {
      const n = Number(id.slice(head.length));
      if (Number.isInteger(n) && n > highest) highest = n;
    }
  }
  let next = highest + 1;
  while (taken.has(`${head}${String(next).padStart(2, "0")}`)) next++;
  return `${head}${String(next).padStart(2, "0")}`;
}

/** Most common country among the city's existing records, or null for a new city. */
export function inferCountry(records, city) {
  const counts = new Map();
  for (const r of records) {
    if (r.city === city && typeof r.country === "string") {
      counts.set(r.country, (counts.get(r.country) ?? 0) + 1);
    }
  }
  let best = null;
  for (const [country, n] of counts) {
    if (best === null || n > best.n) best = { country, n };
  }
  return best ? best.country : null;
}

/** An existing record in the same city with the same normalised name, or null. */
export function findDuplicate(records, city, name) {
  const wanted = normalizePlaceName(name);
  return (
    records.find((r) => r.city === city && normalizePlaceName(r.name) === wanted) ?? null
  );
}

/** `added_by` for the record: the contributor's name as a handle-shaped string. */
export function addedByFor(contributor) {
  const handle = contributor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 39);
  return handle || "community";
}

export function buildPlaceRecord({ sub, coords, country, id }) {
  return {
    id,
    name: sub.name,
    type: sub.type,
    city: sub.city,
    country,
    lat: coords.lat,
    lng: coords.lng,
    gmaps_link: `https://maps.google.com/?q=${coords.lat},${coords.lng}`,
    added_by: addedByFor(sub.contributor),
  };
}
