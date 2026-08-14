#!/usr/bin/env node
/**
 * Validates every data/places/*.json file against data/places.schema.json,
 * the single source of truth for the place-record shape (see #94).
 *
 * Checks:
 *   - Valid JSON and root array
 *   - Required fields present and non-empty (from schema.required)
 *   - No fields outside the schema's properties
 *   - Unique id within each file and across all files
 *   - type is one of the schema's enum values
 *   - lat/lng are numbers within the schema's min/max bounds
 *   - gmaps_link matches the schema's pattern
 *   - No em dashes in any string field
 *
 * Exits 0 when all files pass, 1 when any error is found.
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data/places");
const SCHEMA_PATH = join(__dirname, "../data/places.schema.json");

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

const VALID_TYPES = new Set(schema.properties.type.enum);
const REQUIRED_FIELDS = schema.required;
const KNOWN_FIELDS = new Set(Object.keys(schema.properties));
const BOUNDS = {
  minLat: schema.properties.lat.minimum,
  maxLat: schema.properties.lat.maximum,
  minLng: schema.properties.lng.minimum,
  maxLng: schema.properties.lng.maximum,
};
const GMAPS_RE = new RegExp(schema.properties.gmaps_link.pattern);

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

    // No fields outside the schema (catches stray proof fields like rating/reviews)
    for (const field of Object.keys(r)) {
      if (!KNOWN_FIELDS.has(field)) {
        err(loc, `unknown field "${field}" — not in data/places.schema.json`);
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
        err(loc, `lat ${r.lat} is outside valid bounds [${BOUNDS.minLat}, ${BOUNDS.maxLat}]`);
      }
    }

    // lng bounds
    if (r.lng !== undefined) {
      if (typeof r.lng !== "number") {
        err(loc, `lng must be a number, got ${typeof r.lng}`);
      } else if (r.lng < BOUNDS.minLng || r.lng > BOUNDS.maxLng) {
        err(loc, `lng ${r.lng} is outside valid bounds [${BOUNDS.minLng}, ${BOUNDS.maxLng}]`);
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

    // Optional `verified` object: must carry a non-empty verifier handle and a
    // real YYYY-MM-DD date, and nothing else (see #126).
    if (r.verified !== undefined) {
      if (r.verified === null || typeof r.verified !== "object" || Array.isArray(r.verified)) {
        err(loc, `verified must be an object with "by" and "on", got ${JSON.stringify(r.verified)}`);
      } else {
        const v = r.verified;
        for (const key of Object.keys(v)) {
          if (key !== "by" && key !== "on") {
            err(loc, `verified has unknown field "${key}" — allowed: by, on`);
          }
        }
        if (typeof v.by !== "string" || v.by.trim() === "") {
          err(loc, `verified.by must be a non-empty GitHub username`);
        }
        if (typeof v.on !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.on)) {
          err(loc, `verified.on must be an ISO date (YYYY-MM-DD), got "${v.on}"`);
        } else {
          const d = new Date(`${v.on}T00:00:00Z`);
          const valid = !Number.isNaN(d.getTime()) &&
            d.toISOString().slice(0, 10) === v.on;
          if (!valid) {
            err(loc, `verified.on "${v.on}" is not a real calendar date`);
          }
        }
        if (typeof v.by === "string" && v.by.includes("—")) {
          err(loc, `verified.by contains an em dash (—) — use a plain hyphen instead`);
        }
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
