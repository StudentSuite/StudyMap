#!/usr/bin/env node
/**
 * Turns a `place-submission` issue into a record in data/places/<type>.json.
 * Run by .github/workflows/place-submission.yml, which then opens the pull
 * request. See #264.
 *
 * Reads the issue from the Actions event payload ($GITHUB_EVENT_PATH), never
 * from a shell-interpolated string, so a hostile issue body cannot reach a
 * command line. Writes `status`, `message`, `id`, `branch` and `title` to
 * $GITHUB_OUTPUT (or prints them when run by hand).
 *
 * Statuses:
 *   ready      record appended, open a PR
 *   rejected   body is not a valid submission (comment, no PR)
 *   duplicate  same name already exists in that city
 *   needs-info could not read coordinates, or the city is new and has no country yet
 *
 * Usage: node scripts/process-place-submission.mjs
 */

import { appendFileSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";

import {
  coordinatesFromGoogleMapsUrl,
  isShortGoogleMapsLink,
  resolveShortLink,
} from "./lib/gmaps-coordinates.mjs";
import {
  buildPlaceRecord,
  findDuplicate,
  inferCountry,
  nextPlaceId,
  parseIssueBody,
} from "./lib/place-submission.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data/places");

/**
 * Pure core: no file or git access, so it can be tested. `resolve` turns a
 * short link into a full URL (injected so tests never touch the network).
 */
export async function processSubmission({ body, records, resolve = resolveShortLink }) {
  const sub = parseIssueBody(body);
  if (!sub) {
    return {
      status: "rejected",
      message:
        "This issue does not contain a valid StudyMap place submission, so no pull request was opened.",
    };
  }

  let coords = coordinatesFromGoogleMapsUrl(sub.gmapsLink);
  if (!coords && isShortGoogleMapsLink(sub.gmapsLink)) {
    const resolved = await resolve(sub.gmapsLink);
    if (resolved) coords = coordinatesFromGoogleMapsUrl(resolved);
  }
  if (!coords) {
    return {
      status: "needs-info",
      message:
        "Could not read coordinates from the Google Maps link. A maintainer needs to add them by hand, or ask the submitter for a longer link (open the place in Google Maps, copy the address-bar URL).",
    };
  }

  const duplicate = findDuplicate(records, sub.city, sub.name);
  if (duplicate) {
    return {
      status: "duplicate",
      message: `\`${duplicate.name}\` already exists in ${sub.city} as \`${duplicate.id}\`, so no pull request was opened.`,
    };
  }

  const country = inferCountry(records, sub.city);
  if (!country) {
    return {
      status: "needs-info",
      message: `\`${sub.city}\` has no places in the dataset yet, so its country code is unknown. A maintainer needs to add the record with a country by hand.`,
    };
  }

  const id = nextPlaceId(records, sub.city, sub.type);
  const record = buildPlaceRecord({ sub, coords, country, id });
  return {
    status: "ready",
    message: `Added \`${id}\`. Check the pin location and the quality gate (rating 4.0+, 50+ reviews) before merging.${
      record.website || record.phone || record.hours
        ? " The website, phone and hours were typed by the submitter: confirm each against the place's own site or listing, and drop any you cannot."
        : ""
    }`,
    record,
    sub,
  };
}

/**
 * Appends a record to a data file's JSON text without re-serialising the
 * rest, so the pull request diff is the one new record and nothing else.
 * (Re-serialising would rewrite the file's existing \uXXXX escapes.)
 */
export function appendRecordText(text, record) {
  const entry = JSON.stringify(record, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  const body = text.replace(/\s*\]\s*$/, "");
  const separator = body.trim().endsWith("[") ? "\n" : ",\n";
  return `${body}${separator}${entry}\n]\n`;
}

function loadRecords() {
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => JSON.parse(readFileSync(join(DATA_DIR, f), "utf8")));
}

function setOutput(values) {
  const lines = Object.entries(values).map(([key, value]) => {
    const text = String(value ?? "");
    // Multi-line safe, and the delimiter cannot appear in a value we produce.
    return `${key}<<__SM_EOF__\n${text}\n__SM_EOF__`;
  });
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, lines.join("\n") + "\n");
  } else {
    console.log(values);
  }
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    console.error(
      "GITHUB_EVENT_PATH is not set; this script is meant to run in Actions.",
    );
    process.exit(2);
  }
  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  const issue = event.issue;

  const result = await processSubmission({
    body: issue?.body ?? "",
    records: loadRecords(),
  });

  if (result.status !== "ready") {
    setOutput({ status: result.status, message: result.message });
    return;
  }

  const file = join(DATA_DIR, `${result.record.type}.json`);
  writeFileSync(file, appendRecordText(readFileSync(file, "utf8"), result.record));

  setOutput({
    status: "ready",
    message: result.message,
    id: result.record.id,
    branch: `place-submission/issue-${issue.number}`,
    title: `data: add ${result.record.name} (${result.record.city})`,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
