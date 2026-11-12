#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { isRealIsoDate } from "./lib/data-validation.mjs";
import {
  isVerificationExpired,
  verificationExpiry,
  verificationWindowMonths,
} from "./lib/verification-window.mjs";

// Directories checked when --data-dir is not given. --data-dir overrides this
// list with a single directory, which is how tests point the check at a temp
// fixture directory (see src/lib/data-freshness.test.ts).
const DEFAULT_DATA_DIRS = ["data/places", "data/competitions"];

// For these place types valid_till is the last test administration the centre
// was confirmed for, not a deadline. Once it passes the record is reported as a
// warning (it still shows on the map as "Last confirmed for ..."), so a
// finished administration does not fail the check for every centre at once.
const EXAM_CENTRE_TYPES = new Set(["sat_centre", "foreign_lang_exam_centre"]);

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
  // Competition records all share the 6-month window; places depend on their type.
  const isCompetitionDir = /[\\/]competitions$/.test(dataDir);
  const files = readdirSync(dataDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  let totalRecords = 0;
  let datedRecords = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const warnedFiles = new Set();

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
        } else if (
          record.valid_till < today &&
          !isCompetitionDir &&
          EXAM_CENTRE_TYPES.has(record.type ?? file.replace(/\.json$/, ""))
        ) {
          totalWarnings++;
          if (!warnedFiles.has(file)) {
            warnedFiles.add(file);
            console.warn(
              `WARN  ${file}: valid_till has passed for exam centres (first: ${recordLoc}, ${record.valid_till}); they show as "Last confirmed for <date>" until re-confirmed for the next administration`,
            );
          }
        } else if (record.valid_till < today) {
          // Valid ISO YYYY-MM-DD strings sort in chronological order.
          console.error(
            `ERROR ${recordLoc}: valid_till expired on ${record.valid_till}; re-verify this record for ${today}`,
          );
          totalErrors++;
        }
      }

      // A verification only counts for 12 months (6 for exam centres and competitions).
      if (record.verified !== undefined && record.verified !== null) {
        const on = record.verified.on;
        const months = verificationWindowMonths({
          type: record.type ?? file.replace(/\.json$/, ""),
          competition: isCompetitionDir,
        });
        if (typeof on !== "string" || !isRealIsoDate(on)) {
          console.error(
            `ERROR ${recordLoc}: verified.on must be a real ISO date (YYYY-MM-DD), got "${on}"`,
          );
          totalErrors++;
        } else if (isVerificationExpired(on, months, today)) {
          console.error(
            `ERROR ${recordLoc}: verified.on ${on} is past its ${months}-month window (expired ${verificationExpiry(on, months)}); re-verify this record for ${today}`,
          );
          totalErrors++;
        }
        dated = true;
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

  return { totalRecords, datedRecords, totalErrors, totalWarnings };
}

function checkFreshness({ today, dataDirs }) {
  let totalRecords = 0;
  let datedRecords = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const dataDir of dataDirs) {
    const result = checkDir(dataDir, today);
    totalRecords += result.totalRecords;
    datedRecords += result.datedRecords;
    totalErrors += result.totalErrors;
    totalWarnings += result.totalWarnings;
  }

  if (totalErrors > 0) {
    console.error(
      `Freshness failed: ${totalErrors} stale or invalid record(s) as of ${today}.`,
    );
    return 1;
  }

  const warningNote =
    totalWarnings > 0
      ? `; ${totalWarnings} exam centre record(s) are past their last confirmed administration (warning only)`
      : "";
  console.log(
    `Freshness passed: ${totalRecords} record(s), ${datedRecords} dated record(s), current as of ${today}${warningNote}.`,
  );
  return 0;
}

try {
  process.exitCode = checkFreshness(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(`Freshness failed: ${error.message}`);
  process.exitCode = 1;
}
