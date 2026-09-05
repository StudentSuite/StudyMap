#!/usr/bin/env node
/**
 * Validates every data/competitions/*.json file against
 * data/competitions.schema.json, the single source of truth for the
 * competition-record shape (see #193/#194). Schema-driven, like
 * validate-places.mjs: enum values, required fields and known fields are all
 * derived from the schema rather than hardcoded here.
 *
 * Checks:
 *   - Valid JSON and root array
 *   - Required fields present and non-empty (from schema.required)
 *   - No fields outside the schema's properties
 *   - Unique id within each file and across all files
 *   - category is one of the schema's enum values, and matches the filename
 *     it lives in (the way `type` does for places)
 *   - format / participation are one of the schema's enum values
 *   - region is "international" or a two-letter uppercase code
 *   - fee is an { amount, currency } object
 *   - age_min <= age_max
 *   - dates[] has at least one entry; each entry has a real calendar date,
 *     a valid type enum value, and an https/http source_url that is a
 *     well-formed URL
 *   - country_tracks[].country is one of the 13 permitted codes and does not
 *     repeat within one record; each stage has a real calendar date and a
 *     well-formed source_url
 *   - No em dashes in any string field
 *
 * Exits 0 when all files pass, 1 when any error is found.
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Reporter, hasEmDash, isRealIsoDate, isHttpUrl } from "./lib/data-validation.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, "../data/competitions.schema.json");

// --data-dir=<path> overrides the directory scanned, for tests
// (see src/lib/validate-competitions.test.ts).
const dataDirArg = process.argv.slice(2).find((arg) => arg.startsWith("--data-dir="));
const DATA_DIR = dataDirArg
  ? resolve(dataDirArg.slice("--data-dir=".length))
  : join(__dirname, "../data/competitions");

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

const VALID_CATEGORIES = new Set(schema.properties.category.enum);
const VALID_FORMATS = new Set(schema.properties.format.enum);
const VALID_PARTICIPATION = new Set(schema.properties.participation.enum);
const VALID_DATE_TYPES = new Set(schema.properties.dates.items.properties.type.enum);
const VALID_COUNTRIES = new Set(
  schema.properties.country_tracks.items.properties.country.enum,
);
const REQUIRED_FIELDS = schema.required;
const KNOWN_FIELDS = new Set(Object.keys(schema.properties));
const REGION_RE = /^[A-Z]{2}$/;

const reporter = new Reporter();
const err = (loc, msg) => reporter.err(loc, msg);
const globalIds = new Set();

const files = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error("No JSON files found in data/competitions/");
  process.exit(1);
}

for (const file of files) {
  const filePath = join(DATA_DIR, file);
  let records;

  try {
    records = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    err(file, `invalid JSON — ${e.message}`);
    continue;
  }

  if (!Array.isArray(records)) {
    err(file, "root value must be a JSON array");
    continue;
  }

  const expectedCategory = file.slice(0, -".json".length);
  const fileIds = new Set();
  let fileErrors = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const loc = `${file}[${i}] (id: ${r.id ?? "?"})`;
    const before = reporter.totalErrors;

    if (r === null || typeof r !== "object" || Array.isArray(r)) {
      err(loc, `record must be a JSON object, got ${JSON.stringify(r)}`);
      fileErrors += reporter.totalErrors - before;
      continue;
    }

    // Required fields
    for (const field of REQUIRED_FIELDS) {
      if (r[field] === undefined || r[field] === null || r[field] === "") {
        err(loc, `missing required field "${field}"`);
      }
    }

    // No fields outside the schema
    for (const field of Object.keys(r)) {
      if (!KNOWN_FIELDS.has(field)) {
        err(loc, `unknown field "${field}" — not in data/competitions.schema.json`);
      }
    }

    // Unique id — within file and across all files
    if (r.id) {
      if (fileIds.has(r.id)) {
        err(loc, `duplicate id "${r.id}" within ${file}`);
      } else {
        fileIds.add(r.id);
      }
      if (globalIds.has(r.id)) {
        err(loc, `duplicate id "${r.id}" also exists in another file`);
      } else {
        globalIds.add(r.id);
      }
    }

    // Valid category, and category must match the filename it lives in
    if (r.category !== undefined && !VALID_CATEGORIES.has(r.category)) {
      err(
        loc,
        `invalid category "${r.category}" — valid categories: ${[...VALID_CATEGORIES].join(", ")}`,
      );
    }
    if (r.category !== undefined && r.category !== expectedCategory) {
      err(
        loc,
        `category "${r.category}" does not match filename "${file}" (expected "${expectedCategory}")`,
      );
    }

    // Valid format / participation
    if (r.format !== undefined && !VALID_FORMATS.has(r.format)) {
      err(
        loc,
        `invalid format "${r.format}" — valid formats: ${[...VALID_FORMATS].join(", ")}`,
      );
    }
    if (r.participation !== undefined && !VALID_PARTICIPATION.has(r.participation)) {
      err(
        loc,
        `invalid participation "${r.participation}" — valid values: ${[...VALID_PARTICIPATION].join(", ")}`,
      );
    }

    // region: "international" or a two-letter uppercase code
    if (
      r.region !== undefined &&
      r.region !== "international" &&
      !REGION_RE.test(r.region)
    ) {
      err(
        loc,
        `region must be "international" or a two-letter country code, got "${r.region}"`,
      );
    }

    // fee: { amount, currency }
    if (r.fee !== undefined) {
      if (r.fee === null || typeof r.fee !== "object" || Array.isArray(r.fee)) {
        err(
          loc,
          `fee must be an object with "amount" and "currency", got ${JSON.stringify(r.fee)}`,
        );
      } else {
        if (typeof r.fee.amount !== "number" || r.fee.amount < 0) {
          err(
            loc,
            `fee.amount must be a non-negative number, got ${JSON.stringify(r.fee.amount)}`,
          );
        }
        if (typeof r.fee.currency !== "string" || r.fee.currency.length !== 3) {
          err(
            loc,
            `fee.currency must be a 3-letter currency code, got ${JSON.stringify(r.fee.currency)}`,
          );
        }
      }
    }

    // age_min <= age_max
    if (
      typeof r.age_min === "number" &&
      typeof r.age_max === "number" &&
      r.age_min > r.age_max
    ) {
      err(loc, `age_min (${r.age_min}) must not be greater than age_max (${r.age_max})`);
    }

    // dates[]: at least one entry, each with a real date, valid type, and a
    // resolving-shaped source_url
    if (r.dates !== undefined) {
      if (!Array.isArray(r.dates) || r.dates.length === 0) {
        err(loc, "dates must be a non-empty array");
      } else {
        r.dates.forEach((d, di) => {
          const dloc = `${loc} dates[${di}]`;
          if (d === null || typeof d !== "object" || Array.isArray(d)) {
            err(dloc, `must be an object, got ${JSON.stringify(d)}`);
            return;
          }
          if (!d.label) err(dloc, `missing "label"`);
          if (!isRealIsoDate(d.date)) {
            err(dloc, `date must be a real ISO date (YYYY-MM-DD), got "${d.date}"`);
          }
          if (d.type !== undefined && !VALID_DATE_TYPES.has(d.type)) {
            err(
              dloc,
              `invalid type "${d.type}" — valid types: ${[...VALID_DATE_TYPES].join(", ")}`,
            );
          }
          if (!d.timezone) err(dloc, `missing "timezone"`);
          if (typeof d.estimated !== "boolean") {
            err(dloc, `estimated must be a boolean, got ${JSON.stringify(d.estimated)}`);
          }
          if (!isHttpUrl(d.source_url)) {
            err(
              dloc,
              `source_url must be a well-formed http(s) URL, got "${d.source_url}"`,
            );
          }
        });
      }
    }

    // country_tracks[]: optional, but each entry's country must be one of the
    // 13 permitted codes and must not repeat within the record
    if (r.country_tracks !== undefined) {
      if (!Array.isArray(r.country_tracks)) {
        err(loc, "country_tracks must be an array");
      } else {
        const seenCountries = new Set();
        r.country_tracks.forEach((ct, ci) => {
          const cloc = `${loc} country_tracks[${ci}]`;
          if (ct === null || typeof ct !== "object" || Array.isArray(ct)) {
            err(cloc, `must be an object, got ${JSON.stringify(ct)}`);
            return;
          }
          if (!VALID_COUNTRIES.has(ct.country)) {
            err(
              cloc,
              `invalid country "${ct.country}" — valid codes: ${[...VALID_COUNTRIES].join(", ")}`,
            );
          } else if (seenCountries.has(ct.country)) {
            err(cloc, `duplicate country "${ct.country}" within this record`);
          } else {
            seenCountries.add(ct.country);
          }
          if (!isHttpUrl(ct.official_url)) {
            err(
              cloc,
              `official_url must be a well-formed https URL, got "${ct.official_url}"`,
            );
          }
          if (!Array.isArray(ct.stages) || ct.stages.length === 0) {
            err(cloc, "stages must be a non-empty array");
          } else {
            ct.stages.forEach((st, si) => {
              const sloc = `${cloc} stages[${si}]`;
              if (st === null || typeof st !== "object" || Array.isArray(st)) {
                err(sloc, `must be an object, got ${JSON.stringify(st)}`);
                return;
              }
              if (!st.name) err(sloc, `missing "name"`);
              if (!isRealIsoDate(st.date)) {
                err(sloc, `date must be a real ISO date (YYYY-MM-DD), got "${st.date}"`);
              }
              if (typeof st.estimated !== "boolean") {
                err(
                  sloc,
                  `estimated must be a boolean, got ${JSON.stringify(st.estimated)}`,
                );
              }
              if (!isHttpUrl(st.source_url)) {
                err(
                  sloc,
                  `source_url must be a well-formed http(s) URL, got "${st.source_url}"`,
                );
              }
            });
          }
        });
      }
    }

    // cycle_year sanity
    if (r.cycle_year !== undefined && !Number.isInteger(r.cycle_year)) {
      err(loc, `cycle_year must be an integer, got ${JSON.stringify(r.cycle_year)}`);
    }

    // valid_till format, when present
    if (r.valid_till !== undefined && !isRealIsoDate(r.valid_till)) {
      err(loc, `valid_till must be a real ISO date (YYYY-MM-DD), got "${r.valid_till}"`);
    }

    // No em dashes anywhere (recursively, since competitions nest objects/arrays)
    checkEmDashes(r, loc);

    // Optional `verified` object: same shape as places (see #126)
    if (r.verified !== undefined) {
      if (
        r.verified === null ||
        typeof r.verified !== "object" ||
        Array.isArray(r.verified)
      ) {
        err(
          loc,
          `verified must be an object with "by" and "on", got ${JSON.stringify(r.verified)}`,
        );
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
        if (!isRealIsoDate(v.on)) {
          err(loc, `verified.on must be a real ISO date (YYYY-MM-DD), got "${v.on}"`);
        }
      }
    }

    fileErrors += reporter.totalErrors - before;
  }

  const status = fileErrors === 0 ? " OK " : "FAIL";
  console.log(
    `  ${status}   ${file} (${records.length} records, ${fileErrors} error(s))`,
  );
}

function checkEmDashes(value, loc, path = "") {
  if (typeof value === "string") {
    if (hasEmDash(value)) {
      err(
        loc,
        `field "${path || "(root)"}" contains an em dash (—) — use a plain hyphen instead`,
      );
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => checkEmDashes(v, loc, `${path}[${i}]`));
  } else if (value !== null && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      checkEmDashes(v, loc, path ? `${path}.${key}` : key);
    }
  }
}

console.log("");
if (reporter.totalErrors > 0) {
  console.error(
    `Validation failed: ${reporter.totalErrors} error(s), ${reporter.totalWarnings} warning(s). Fix the errors before merging.`,
  );
  process.exit(1);
} else {
  console.log(
    `Validation passed: all ${files.length} file(s) clean, ${reporter.totalWarnings} warning(s).`,
  );
}
