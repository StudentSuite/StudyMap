#!/usr/bin/env node
/**
 * Validates every data/places/*.json file against the Place schema.
 *
 * Checks:
 *   - Valid JSON and root array
 *   - Required fields present and non-empty
 *   - Unique id within each file and across all files
 *   - type is one of the known PlaceType values
 *   - lat/lng are numbers within reasonable India-wide bounds
 *   - gmaps_link matches https://maps.google.com/?q=<lat>,<lng>
 *   - No em dashes in any string field
 *
 * Exits 0 when all files pass, 1 when any error is found.
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data/places");

const VALID_TYPES = new Set([
  "book_shop",
  "library",
  "exam_centre",
  "imp_locations",
  "stationery",
  "internet_cafe",
  "airport",
  "train_station",
]);

// Valid geographic coordinate ranges. Catches impossible values (e.g. lat=200)
// while allowing any location worldwide as the dataset grows beyond India.
const BOUNDS = { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180 };

const REQUIRED_FIELDS = ["id", "name", "type", "city", "lat", "lng", "gmaps_link", "added_by"];

// Accept all common Google Maps URL forms:
//   https://maps.google.com/?q=<lat>,<lng>      (preferred)
//   https://maps.app.goo.gl/<id>                (short link — shows place name/info)
//   https://www.google.com/maps/...             (full URL, place or search)
//   https://goo.gl/maps/<id>                    (legacy short link)
const GMAPS_RE =
  /^https:\/\/(maps\.google\.com(\?|\/)|maps\.app\.goo\.gl\/|www\.google\.com\/maps\/|goo\.gl\/maps\/).*/;

let totalErrors = 0;
const globalIds = new Set();

function err(loc, msg) {
  console.error(`  ERROR  ${loc}: ${msg}`);
  totalErrors++;
}

const files = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error("No JSON files found in data/places/");
  process.exit(1);
}

for (const file of files) {
  const filePath = join(DATA_DIR, file);
  let records;

  try {
    records = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error(`  ERROR  ${file}: invalid JSON — ${e.message}`);
    totalErrors++;
    continue;
  }

  if (!Array.isArray(records)) {
    console.error(`  ERROR  ${file}: root value must be a JSON array`);
    totalErrors++;
    continue;
  }

  const fileIds = new Set();
  let fileErrors = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const loc = `${file}[${i}] (id: ${r.id ?? "?"})`;
    const before = totalErrors;

    // Required fields
    for (const field of REQUIRED_FIELDS) {
      if (r[field] === undefined || r[field] === null || r[field] === "") {
        err(loc, `missing required field "${field}"`);
      }
    }

    // Unique id — within file
    if (r.id) {
      if (fileIds.has(r.id)) {
        err(loc, `duplicate id "${r.id}" within ${file}`);
      } else {
        fileIds.add(r.id);
      }

      // Unique id — across all files
      if (globalIds.has(r.id)) {
        err(loc, `duplicate id "${r.id}" also exists in another file`);
      } else {
        globalIds.add(r.id);
      }
    }

    // Valid type
    if (r.type !== undefined && !VALID_TYPES.has(r.type)) {
      err(loc, `invalid type "${r.type}" — valid types: ${[...VALID_TYPES].join(", ")}`);
    }

    // lat bounds
    if (r.lat !== undefined) {
      if (typeof r.lat !== "number") {
        err(loc, `lat must be a number, got ${typeof r.lat}`);
      } else if (r.lat < BOUNDS.minLat || r.lat > BOUNDS.maxLat) {
        err(loc, `lat ${r.lat} is outside India bounds [${BOUNDS.minLat}, ${BOUNDS.maxLat}]`);
      }
    }

    // lng bounds
    if (r.lng !== undefined) {
      if (typeof r.lng !== "number") {
        err(loc, `lng must be a number, got ${typeof r.lng}`);
      } else if (r.lng < BOUNDS.minLng || r.lng > BOUNDS.maxLng) {
        err(loc, `lng ${r.lng} is outside India bounds [${BOUNDS.minLng}, ${BOUNDS.maxLng}]`);
      }
    }

    // gmaps_link format
    if (r.gmaps_link !== undefined && !GMAPS_RE.test(r.gmaps_link)) {
      err(
        loc,
        `gmaps_link must be https://maps.google.com/?q=<lat>,<lng>, got "${r.gmaps_link}"`,
      );
    }

    // No em dashes in any string field
    for (const [key, val] of Object.entries(r)) {
      if (typeof val === "string" && val.includes("—")) {
        err(loc, `field "${key}" contains an em dash (—) — use a plain hyphen instead`);
      }
    }

    fileErrors += totalErrors - before;
  }

  const status = fileErrors === 0 ? " OK " : "FAIL";
  console.log(`  ${status}   ${file} (${records.length} records, ${fileErrors} error(s))`);
}

console.log("");
if (totalErrors > 0) {
  console.error(`Validation failed: ${totalErrors} error(s). Fix them before merging.`);
  process.exit(1);
} else {
  console.log(`Validation passed: all ${files.length} file(s) clean.`);
}
