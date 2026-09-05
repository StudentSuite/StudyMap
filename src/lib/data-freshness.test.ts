import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest only discovers tests under src/, so this CLI integration test lives here.
const SCRIPT = resolve(process.cwd(), "scripts/check-data-freshness.mjs");
const TODAY = "2026-08-22";

function runFreshness(records: unknown[], today = TODAY) {
  const dataDir = mkdtempSync(join(tmpdir(), "studymap-freshness-"));

  try {
    writeFileSync(join(dataDir, "sat_centre.json"), JSON.stringify(records));
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

  it("fails when a valid_till deadline has passed", () => {
    const result = runFreshness([{ id: "stale", valid_till: "2026-08-21" }]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("id: stale");
    expect(result.stderr).toContain("valid_till expired on 2026-08-21");
  });

  it("fails on an impossible valid_till date", () => {
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
});
