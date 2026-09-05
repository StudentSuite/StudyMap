import { describe, expect, it } from "vitest";

import {
  EMPTY_COMPETITION_FILTERS,
  type CompetitionFilterState,
} from "@/components/competitions/filters";
import {
  competitionFiltersToSearch,
  parseCompetitionFilters,
} from "@/lib/competitions-share";

describe("competitionFiltersToSearch / parseCompetitionFilters round-trip", () => {
  it("round-trips a fully populated state", () => {
    const state: CompetitionFilterState = {
      categories: ["stem", "coding"],
      format: "online",
      participation: "team",
      region: "US",
      freeOnly: true,
      age: 16,
      deadlineWindow: "30",
      query: "robotics",
    };
    const search = competitionFiltersToSearch(state);
    expect(parseCompetitionFilters(search)).toEqual(state);
  });

  it("round-trips the empty state as an empty query string", () => {
    expect(competitionFiltersToSearch(EMPTY_COMPETITION_FILTERS)).toBe("");
    expect(parseCompetitionFilters("")).toEqual(EMPTY_COMPETITION_FILTERS);
  });

  it("drops an unknown category when parsing", () => {
    const parsed = parseCompetitionFilters("?categories=stem,not_a_real_category");
    expect(parsed.categories).toEqual(["stem"]);
  });

  it("drops an unknown format/participation/deadline value", () => {
    const parsed = parseCompetitionFilters(
      "?format=bogus&participation=bogus&deadline=bogus",
    );
    expect(parsed.format).toBeNull();
    expect(parsed.participation).toBeNull();
    expect(parsed.deadlineWindow).toBeNull();
  });

  it("treats a blank region as unset", () => {
    expect(parseCompetitionFilters("?region=").region).toBeNull();
  });

  it("clamps an out-of-range age to unset", () => {
    expect(parseCompetitionFilters("?age=150").age).toBeNull();
    expect(parseCompetitionFilters("?age=-1").age).toBeNull();
    expect(parseCompetitionFilters("?age=not-a-number").age).toBeNull();
  });

  it("reads freeOnly only from an explicit free=1", () => {
    expect(parseCompetitionFilters("?free=1").freeOnly).toBe(true);
    expect(parseCompetitionFilters("?free=0").freeOnly).toBe(false);
    expect(parseCompetitionFilters("").freeOnly).toBe(false);
  });
});
