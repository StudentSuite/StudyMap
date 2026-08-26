#!/usr/bin/env node
/**
 * Generates src/lib/docs-meta.generated.json: last-modified date (from git
 * history) and a rough read-time estimate (from word count) per /docs route.
 *
 * Runs at build time (via the "prebuild" npm hook) because:
 *   - git history isn't available in a Vercel serverless function at
 *     runtime (.git isn't part of the deployment output), so this can't be
 *     a per-request lookup.
 *   - docs-nav.ts is imported by client components, so date/readTime can't
 *     live there without pulling Node's fs/child_process into the client
 *     bundle -- they live in this generated JSON instead, which is a plain
 *     data import.
 *
 * Hrefs are read out of docs-nav.ts by regex rather than importing it,
 * since it's a .ts file and this script runs as plain Node ESM.
 */

import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DOCS_NAV_PATH = join(ROOT, "src/lib/docs-nav.ts");
const OUTPUT_PATH = join(ROOT, "src/lib/docs-meta.generated.json");

const WORDS_PER_MINUTE = 200;
const FALLBACK_DATE = new Date().toISOString().slice(0, 10);

function sourcePathForHref(href) {
  if (href === "/docs") return join(ROOT, "src/app/docs/page.tsx");
  const slug = href.replace("/docs/", "");
  return join(ROOT, "src/app/docs/(article)", slug, "page.tsx");
}

function lastModifiedDate(absPath) {
  try {
    const out = execFileSync(
      "git",
      // --diff-filter=AM skips pure-rename commits (e.g. a route-group move)
      // so this reflects the last real content change, not the last move.
      ["log", "--follow", "--diff-filter=AM", "-1", "--date=short", "--format=%ad", "--", absPath],
      { cwd: ROOT, encoding: "utf8" },
    ).trim();
    return out || FALLBACK_DATE;
  } catch {
    return FALLBACK_DATE;
  }
}

function readTime(absPath) {
  let text;
  try {
    text = readFileSync(absPath, "utf8");
  } catch {
    return "1 min read";
  }

  const stripped = text
    .replace(/^import .*$/gm, "")
    .replace(/^export .*from.*$/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[{}();]/g, " ");

  const words = stripped.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

function main() {
  const navSource = readFileSync(DOCS_NAV_PATH, "utf8");
  const hrefs = [...navSource.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);

  const meta = {};
  for (const href of hrefs) {
    const absPath = sourcePathForHref(href);
    meta[href] = {
      date: lastModifiedDate(absPath),
      readTime: readTime(absPath),
    };
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(meta, null, 2) + "\n");
  console.log(`docs-meta.generated.json: wrote ${hrefs.length} entries`);
}

main();
