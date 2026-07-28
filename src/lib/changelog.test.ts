import { describe, expect, it } from "vitest";

import { parseChangelog } from "@/lib/changelog";

const CHANGELOG = `# Changelog

All notable changes to StudyMap are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-07-03

### Added

- New feature one.
- New feature two with \`inline code\`.

### Fixed

- A bug (#42).

## [2.0.0] - 2026-07-01

### Removed

- Old thing.
`;

describe("parseChangelog", () => {
  it("parses releases in document order with version and date", () => {
    const releases = parseChangelog(CHANGELOG);

    expect(releases).toHaveLength(2);
    expect(releases[0]).toMatchObject({ version: "2.1.0", date: "2026-07-03" });
    expect(releases[1]).toMatchObject({ version: "2.0.0", date: "2026-07-01" });
  });

  it("groups items under their nearest ### section within a release", () => {
    const [latest] = parseChangelog(CHANGELOG);

    expect(latest.sections.map((s) => s.heading)).toEqual(["Added", "Fixed"]);
    expect(latest.sections[0].items).toEqual([
      "New feature one.",
      "New feature two with `inline code`.",
    ]);
    expect(latest.sections[1].items).toEqual(["A bug (#42)."]);
  });

  it("ignores the intro paragraph before the first ## [ heading", () => {
    expect(parseChangelog("Just some prose.\n\nNo headings here.")).toEqual([]);
  });
});
