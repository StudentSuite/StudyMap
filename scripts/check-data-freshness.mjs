#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { isRealIsoDate } from "./lib/data-validation.mjs";

// Directories checked when --data-dir is not given. --data-dir overrides this
// list with a single directory, which is how tests point the check at a temp
// fixture directory (see src/lib/data-freshness.test.ts).
const DEFAULT_DATA_DIRS = ["data/places", "data/competitions"];

function parseArgs(argv) {
  let today = new Date().toISOString().slice(0, 10);
  let dataDirs = DEFAULT_DATA_DIRS.map((dir) => resolve(dir));

  for (const arg of argv) {
    if (arg.startsWith("--today=")) {
      today = arg.slice("--today=".length);
    } else if (arg.startsWith("--data-dir=")) {
      dataDirs = [resolve(arg.slice("--data-dir=".length))];
    } else {
      throw new Error(`unknown argument "${arg}"`);
    }
  }

  if (!isRealIsoDate(today)) {
    throw new Error(`--today must be a real ISO date (YYYY-MM-DD), got "${today}"`);
  }

  return { today, dataDirs };
}

// Whether a competition record's cycle has visibly lapsed: its cycle_year is
// before the current year, or the last entry in its dates[] array (its final
// milestone, e.g. a ceremony or results date) is in the past.
function cycleHasLapsed(record, today) {
  const todayYear = Number(today.slice(0, 4));

  if (typeof record.cycle_year === "number" && record.cycle_year < todayYear) {
    return `cycle_year ${record.cycle_year} has passed (current year is ${todayYear})`;
  }

  if (Array.isArray(record.dates) && record.dates.length > 0) {
    const last = record.dates[record.dates.length - 1];
    if (last && isRealIsoDate(last.date) && last.date < today) {
      return `last dates[] entry "${last.label ?? last.date}" (${last.date}) is in the past`;
    }
  }

  return null;
}

function checkDir(dataDir, today) {
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

      const recordLoc = `${loc} (id: ${record.id ?? "?"})`;
      let dated = false;

      if (record.valid_till !== undefined) {
        dated = true;

        if (!isRealIsoDate(record.valid_till)) {
          console.error(
            `ERROR ${recordLoc}: valid_till must be a real ISO date (YYYY-MM-DD), got "${record.valid_till}"`,
          );
          totalErrors++;
        } else if (record.valid_till < today) {
          // Valid ISO YYYY-MM-DD strings sort in chronological order.
          console.error(
            `ERROR ${recordLoc}: valid_till expired on ${record.valid_till}; re-verify this record for ${today}`,
          );
          totalErrors++;
        }
      }

      const lapseReason = cycleHasLapsed(record, today);
      if (lapseReason) {
        dated = true;
        console.error(
          `ERROR ${recordLoc}: ${lapseReason}; refresh this record for ${today}`,
        );
        totalErrors++;
      }

      if (dated) datedRecords++;
    }
  }

  return { totalRecords, datedRecords, totalErrors };
}

function checkFreshness({ today, dataDirs }) {
  let totalRecords = 0;
  let datedRecords = 0;
  let totalErrors = 0;

  for (const dataDir of dataDirs) {
    const result = checkDir(dataDir, today);
    totalRecords += result.totalRecords;
    datedRecords += result.datedRecords;
    totalErrors += result.totalErrors;
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
