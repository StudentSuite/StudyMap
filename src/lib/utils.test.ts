import { describe, expect, it } from "vitest";

import { cn, isMissingTableError } from "@/lib/utils";

describe("isMissingTableError", () => {
  it("is true for PostgREST's schema-cache-miss code (PGRST205)", () => {
    expect(isMissingTableError({ code: "PGRST205" })).toBe(true);
  });

  it("is false for a real Postgres 'undefined_table' error (42P01)", () => {
    // isMissingTableError only recognizes PostgREST's own missing-table
    // signal, not raw Postgres codes - a 42P01 straight from Postgres
    // (bypassing PostgREST) is a different failure mode and shouldn't be
    // silently treated the same way.
    expect(isMissingTableError({ code: "42P01" })).toBe(false);
  });

  it("is false for other Postgres/PostgREST error codes", () => {
    expect(isMissingTableError({ code: "23505" })).toBe(false); // unique_violation
    expect(isMissingTableError({ code: "PGRST116" })).toBe(false); // no rows found
  });

  it("is false for null, undefined, and primitives", () => {
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError(undefined)).toBe(false);
    expect(isMissingTableError("PGRST205")).toBe(false);
    expect(isMissingTableError(42)).toBe(false);
  });

  it("is false for an object with no code property", () => {
    expect(isMissingTableError({ message: "boom" })).toBe(false);
  });

  it("is false for a real Error instance", () => {
    expect(isMissingTableError(new Error("network failure"))).toBe(false);
  });
});

describe("cn", () => {
  it("merges class names, dropping falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c");
  });

  it("resolves conflicting Tailwind utility classes to the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("supports conditional objects", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
