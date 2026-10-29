import { describe, expect, it } from "vitest";

import { isCountryCode } from "../../scripts/lib/data-validation.mjs";

describe("isCountryCode", () => {
  it("accepts two capital letters", () => {
    for (const code of ["IN", "GB", "KE", "US"]) expect(isCountryCode(code)).toBe(true);
  });

  it("rejects names, lower case, wrong length and non-strings", () => {
    for (const value of [
      "india",
      "in",
      "In",
      "IND",
      "I",
      "",
      "I1",
      "I N",
      undefined,
      null,
      7,
    ]) {
      expect(isCountryCode(value), String(value)).toBe(false);
    }
  });
});
