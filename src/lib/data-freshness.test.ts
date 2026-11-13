import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest only discovers tests under src/, so this CLI integration test lives here.
const SCRIPT = resolve(process.cwd(), "scripts/check-data-freshness.mjs");
const TODAY = "2026-08-22";

function runFreshness(records: unknown[], today = TODAY, file = "sat_centre.json") {
  const dataDir = mkdtempSync(join(tmpdir(), "studymap-freshness-"));

  try {
    writeFileSync(join(dataDir, file), JSON.stringify(records));
    return spawnSync(
      process.execPath,
      [SCRIPT, `--data-dir=${dataDir}`, `--today=${today}`],
      { encoding: "utf8" },
    );
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
}

describe("data freshness check", () => {
  it("accepts records expiring today or later and ignores undated records", () => {
    const result = runFreshness([
      { id: "today", valid_till: "2026-08-22" },
      { id: "future", valid_till: "2026-11-07" },
      { id: "undated" },
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("3 record(s), 2 dated record(s)");
  });

  it("warns, without failing, when an exam centre's last confirmed date has passed", () => {
    const result = runFreshness([{ id: "centre", valid_till: "2026-08-21" }]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("WARN");
    expect(result.stderr).toContain("sat_centre.json");
    expect(result.stderr).not.toContain("ERROR");
    expect(result.stdout).toContain("1 exam centre record(s)");
  });

  it("applies the same warning to foreign language exam centres", () => {
    const result = runFreshness(
      [{ id: "centre", valid_till: "2026-08-21" }],
      TODAY,
      "foreign_lang_exam_centre.json",
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("WARN");
  });

  it("fails when a valid_till deadline has passed on a non-exam-centre place", () => {
    const result = runFreshness(
      [{ id: "stale", valid_till: "2026-08-21" }],
      TODAY,
      "library.json",
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("id: stale");
    expect(result.stderr).toContain("valid_till expired on 2026-08-21");
  });

  it("still fails on an impossible valid_till date for an exam centre", () => {
    const result = runFreshness([{ id: "bad-date", valid_till: "2026-02-30" }]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("id: bad-date");
    expect(result.stderr).toContain("valid_till must be a real ISO date");
  });

  it("fails cleanly when a data row is not an object", () => {
    const result = runFreshness([null]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("record must be a JSON object");
    expect(result.stderr).not.toContain("TypeError");
  });

  it("rejects an invalid injected current date", () => {
    const result = runFreshness([], "2026-02-30");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--today must be a real ISO date");
  });

  it("flags a competition whose cycle_year has passed", () => {
    const result = runFreshness([{ id: "old-cycle", cycle_year: 2025 }]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("id: old-cycle");
    expect(result.stderr).toContain("cycle_year 2025 has passed");
  });

  it("accepts a competition whose cycle_year has not passed", () => {
    const result = runFreshness([{ id: "current-cycle", cycle_year: 2026 }]);

    expect(result.status).toBe(0);
  });

  it("flags a competition whose last dates[] entry is in the past", () => {
    const result = runFreshness([
      {
        id: "stale-dates",
        cycle_year: 2026,
        dates: [
          { label: "Registration opens", date: "2026-01-01" },
          { label: "Results announced", date: "2026-08-01" },
        ],
      },
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("id: stale-dates");
    expect(result.stderr).toContain(
      'last dates[] entry "Results announced" (2026-08-01) is in the past',
    );
  });

  it("accepts a competition whose last dates[] entry is in the future", () => {
    const result = runFreshness([
      {
        id: "upcoming-dates",
        cycle_year: 2026,
        dates: [
          { label: "Registration opens", date: "2026-01-01" },
          { label: "Deadline", date: "2026-11-07" },
        ],
      },
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("1 record(s), 0 dated record(s)");
  });

  describe("verification window", () => {
    // TODAY is 2026-08-22, so 6 months back is 2026-02-22 and 12 months back is 2025-08-22.
    it("flags an exam centre verified more than 6 months ago", () => {
      const result = runFreshness([
        { id: "old-centre", type: "sat_centre", verified: { by: "a", on: "2026-02-21" } },
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("id: old-centre");
      expect(result.stderr).toContain(
        "verified.on 2026-02-21 is past its 6-month window",
      );
    });

    it("accepts an exam centre verified exactly 6 months ago", () => {
      const result = runFreshness([
        { id: "centre", type: "sat_centre", verified: { by: "a", on: "2026-02-22" } },
      ]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("1 record(s), 1 dated record(s)");
    });

    it("gives every other place type 12 months", () => {
      const library = (on: string) => [
        { id: "lib", type: "library", verified: { by: "a", on } },
      ];

      expect(runFreshness(library("2026-02-21"), TODAY, "library.json").status).toBe(0);
      expect(runFreshness(library("2025-08-22"), TODAY, "library.json").status).toBe(0);
      const old = runFreshness(library("2025-08-21"), TODAY, "library.json");
      expect(old.status).toBe(1);
      expect(old.stderr).toContain("past its 12-month window (expired 2026-08-21)");
    });

    it("reads the place type from the file name when the record has none", () => {
      const record = [{ id: "centre", verified: { by: "a", on: "2026-02-21" } }];

      expect(runFreshness(record, TODAY, "sat_centre.json").status).toBe(1);
      expect(runFreshness(record, TODAY, "library.json").status).toBe(0);
    });

    it("flags a verified.on that is not a real date", () => {
      const result = runFreshness([
        { id: "typo", type: "library", verified: { by: "a", on: "2026-02-30" } },
      ]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("verified.on must be a real ISO date");
    });

    it("ignores records with no verified block", () => {
      expect(runFreshness([{ id: "plain", type: "sat_centre" }]).status).toBe(0);
    });
  });
});
