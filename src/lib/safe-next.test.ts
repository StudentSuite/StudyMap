import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it.each([
    [null, "/"],
    ["", "/"],
    ["/", "/"],
    ["/map", "/map"],
    ["/calendar?term=fall#today", "/calendar?term=fall#today"],
  ])("maps %j to %j", (raw, expected) => {
    expect(safeNext(raw)).toBe(expected);
  });

  it.each([
    "https://evil.example",
    "http://evil.example",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "/\tevil.example",
    "/\nevil.example",
    "\u0000/map",
    "map",
    "?next=/map",
    "#map",
  ])("rejects unsafe redirect %j", (raw) => {
    expect(safeNext(raw)).toBe("/");
  });
});
