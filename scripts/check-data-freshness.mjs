#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseArgs(argv) {
  let today = new Date().toISOString().slice(0, 10);
  let dataDir = resolve("data/places");

  for (const arg of argv) {
    if (arg.startsWith("--today=")) {
      today = arg.slice("--today=".length);
    } else if (arg.startsWith("--data-dir=")) {
      dataDir = resolve(arg.slice("--data-dir=".length));
    } else {
      throw new Error(`unknown argument "${arg}"`);
    }
  }

  if (!isRealIsoDate(today)) {
    throw new Error(`--today must be a real ISO date (YYYY-MM-DD), got "${today}"`);
  }

  return { today, dataDir };
}

function checkFreshness({ today, dataDir }) {
  const files = readdirSync(dataDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  let totalRecords = 0;
  let datedRecords = 0;
  let totalErrors = 0;

  for (const file of files) {
    const path = resolve(dataDir, file);
    let records;

    try {
      records = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      console.error(`ERROR ${file}: invalid JSON: ${error.message}`);
      totalErrors++;
      continue;
    }

    if (!Array.isArray(records)) {
      console.error(`ERROR ${file}: root value must be a JSON array`);
      totalErrors++;
      continue;
    }

    totalRecords += records.length;

    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const loc = `${file}[${index}]`;

      if (record === null || typeof record !== "object" || Array.isArray(record)) {
        console.error(`ERROR ${loc}: record must be a JSON object`);
        totalErrors++;
        continue;
      }

      if (record.valid_till === undefined) continue;

      datedRecords++;
      const recordLoc = `${loc} (id: ${record.id ?? "?"})`;

      if (!isRealIsoDate(record.valid_till)) {
        console.error(
          `ERROR ${recordLoc}: valid_till must be a real ISO date (YYYY-MM-DD), got "${record.valid_till}"`,
        );
        totalErrors++;
        continue;
      }

      // Valid ISO YYYY-MM-DD strings sort in chronological order.
      if (record.valid_till < today) {
        console.error(
          `ERROR ${recordLoc}: valid_till expired on ${record.valid_till}; re-verify this record for ${today}`,
        );
        totalErrors++;
      }
    }
  }

  if (totalErrors > 0) {
    console.error(
      `Freshness failed: ${totalErrors} stale or invalid record(s) as of ${today}.`,
    );
    return 1;
  }

  console.log(
    `Freshness passed: ${totalRecords} record(s), ${datedRecords} dated record(s), current as of ${today}.`,
  );
  return 0;
}

try {
  process.exitCode = checkFreshness(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(`Freshness failed: ${error.message}`);
  process.exitCode = 1;
}
