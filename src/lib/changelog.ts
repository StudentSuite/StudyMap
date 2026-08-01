import { readFileSync } from "fs";
import { join } from "path";

export interface ChangelogSection {
  heading: string;
  items: string[];
}

export interface ChangelogRelease {
  version: string;
  date: string;
  sections: ChangelogSection[];
}

const VERSION_PATTERN = /^## \[(.+?)\] - (.+)$/;
const SECTION_PATTERN = /^### (.+)$/;
const ITEM_PATTERN = /^- (.+)$/;

/**
 * Parses CHANGELOG.md's Keep-a-Changelog-formatted body (`## [x.y.z] - date`,
 * `### Category`, `- item`) into structured releases. Content past the intro
 * paragraph and before the first `## [` heading is ignored.
 */
export function parseChangelog(markdown: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];
  let currentRelease: ChangelogRelease | null = null;
  let currentSection: ChangelogSection | null = null;

  for (const line of markdown.split("\n")) {
    const versionMatch = VERSION_PATTERN.exec(line);
    if (versionMatch) {
      currentRelease = { version: versionMatch[1], date: versionMatch[2], sections: [] };
      releases.push(currentRelease);
      currentSection = null;
      continue;
    }
    if (!currentRelease) continue;

    const sectionMatch = SECTION_PATTERN.exec(line);
    if (sectionMatch) {
      currentSection = { heading: sectionMatch[1], items: [] };
      currentRelease.sections.push(currentSection);
      continue;
    }

    const itemMatch = ITEM_PATTERN.exec(line);
    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1]);
    }
  }

  return releases;
}

/** Reads and parses CHANGELOG.md from the repo root. Server-only (uses `fs`). */
export function getChangelog(): ChangelogRelease[] {
  const raw = readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");
  return parseChangelog(raw);
}
