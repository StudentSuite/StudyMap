import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest only discovers tests under src/, so this CLI integration test lives
// here, mirroring src/lib/data-freshness.test.ts.
const SCRIPT = resolve(process.cwd(), "scripts/validate-competitions.mjs");

function validRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "sample-competition",
    name: "Sample Competition",
    organizer: "Sample Org",
    organizer_url: "https://example.com",
    category: "stem",
    subjects: ["science"],
    description: "A sample competition for testing.",
    format: "online",
    age_min: 13,
    age_max: 18,
    participation: "individual",
    region: "international",
    fee: { amount: 0, currency: "USD" },
    prize: "A prize",
    official_url: "https://example.com",
    cycle_year: 2026,
    dates: [
      {
        label: "Deadline",
        date: "2026-06-01",
        type: "deadline",
        timezone: "UTC",
        estimated: false,
        source_url: "https://example.com/rules",
      },
    ],
    added_by: "tester",
    ...overrides,
  };
}

function runValidator(files: Record<string, unknown[]>) {
  const dataDir = mkdtempSync(join(tmpdir(), "studymap-validate-competitions-"));

  try {
    for (const [name, records] of Object.entries(files)) {
      writeFileSync(join(dataDir, name), JSON.stringify(records));
    }
    return spawnSync(process.execPath, [SCRIPT, `--data-dir=${dataDir}`], {
      encoding: "utf8",
    });
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
}

describe("competitions validator", () => {
  it("passes a well-formed record", () => {
    const result = runValidator({ "stem.json": [validRecord()] });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Validation passed");
  });

  it("fails when category does not match the filename", () => {
    const result = runValidator({
      "stem.json": [validRecord({ category: "coding" })],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("id: sample-competition");
    expect(result.stderr).toContain('does not match filename "stem.json"');
  });

  it("fails on a duplicate id within and across files", () => {
    const result = runValidator({
      "stem.json": [validRecord()],
      "coding.json": [validRecord({ category: "coding" })],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('duplicate id "sample-competition"');
  });

  it("fails when age_min is greater than age_max", () => {
    const result = runValidator({
      "stem.json": [validRecord({ age_min: 20, age_max: 10 })],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("age_min (20) must not be greater than age_max (10)");
  });

  it("fails on an impossible calendar date in dates[]", () => {
    const result = runValidator({
      "stem.json": [
        validRecord({
          dates: [
            {
              label: "Deadline",
              date: "2026-02-30",
              type: "deadline",
              timezone: "UTC",
              estimated: false,
              source_url: "https://example.com/rules",
            },
          ],
        }),
      ],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("date must be a real ISO date");
  });

  it("fails when dates[] is empty", () => {
    const result = runValidator({ "stem.json": [validRecord({ dates: [] })] });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("dates must be a non-empty array");
  });

  it("fails on a source_url that isn't a well-formed URL", () => {
    const result = runValidator({
      "stem.json": [
        validRecord({
          dates: [
            {
              label: "Deadline",
              date: "2026-06-01",
              type: "deadline",
              timezone: "UTC",
              estimated: false,
              source_url: "not-a-url",
            },
          ],
        }),
      ],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("source_url must be a well-formed http(s) URL");
  });

  it("fails on an invalid date type enum value", () => {
    const result = runValidator({
      "stem.json": [
        validRecord({
          dates: [
            {
              label: "Deadline",
              date: "2026-06-01",
              type: "bogus",
              timezone: "UTC",
              estimated: false,
              source_url: "https://example.com/rules",
            },
          ],
        }),
      ],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('invalid type "bogus"');
  });

  it("fails on an invalid country_tracks country code", () => {
    const result = runValidator({
      "stem.json": [
        validRecord({
          country_tracks: [
            {
              country: "ZZ",
              official_url: "https://example.com",
              stages: [
                {
                  name: "Stage",
                  date: "2026-01-01",
                  estimated: false,
                  source_url: "https://example.com",
                },
              ],
            },
          ],
        }),
      ],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('invalid country "ZZ"');
  });

  it("fails on a repeated country within one record's country_tracks", () => {
    const result = runValidator({
      "stem.json": [
        validRecord({
          country_tracks: [
            {
              country: "IN",
              official_url: "https://example.com",
              stages: [
                {
                  name: "A",
                  date: "2026-01-01",
                  estimated: false,
                  source_url: "https://example.com",
                },
              ],
            },
            {
              country: "IN",
              official_url: "https://example.com",
              stages: [
                {
                  name: "B",
                  date: "2026-02-01",
                  estimated: false,
                  source_url: "https://example.com",
                },
              ],
            },
          ],
        }),
      ],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('duplicate country "IN"');
  });

  it("fails on an em dash anywhere in the record", () => {
    const result = runValidator({
      "stem.json": [validRecord({ description: "A competition — with an em dash." })],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("contains an em dash");
  });

  it("fails on an unknown field not in the schema", () => {
    const result = runValidator({
      "stem.json": [validRecord({ rating: 4.8 })],
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('unknown field "rating"');
  });
});
