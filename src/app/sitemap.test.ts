import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { getCompetitions } from "@/lib/competitions";
import { site } from "@/lib/site";

describe("sitemap", () => {
  it("includes /competitions and every competition detail route", () => {
    const entries = sitemap();
    const competitions = getCompetitions();

    const indexEntry = entries.find((e) => e.url === `${site.url}/competitions`);
    expect(indexEntry).toBeDefined();

    for (const competition of competitions) {
      const entry = entries.find(
        (e) => e.url === `${site.url}/competitions/${competition.id}`,
      );
      expect(entry).toBeDefined();
    }

    // 1 index route + one per competition record.
    const competitionUrls = entries.filter((e) =>
      e.url.startsWith(`${site.url}/competitions`),
    );
    expect(competitionUrls).toHaveLength(competitions.length + 1);
  });

  it("never uses new Date() as a stand-in lastModified for a competition", () => {
    const entries = sitemap();
    const now = Date.now();
    const competitions = getCompetitions();

    for (const competition of competitions) {
      const entry = entries.find(
        (e) => e.url === `${site.url}/competitions/${competition.id}`,
      );
      if (!entry?.lastModified) continue;
      // A real dataset date should never land within a second of "now" -
      // the smell of `new Date()` sneaking back in (see #163).
      expect(Math.abs(new Date(entry.lastModified).getTime() - now)).toBeGreaterThan(1000);
    }
  });

  it("every competition route carries a real lastModified when the record has one", () => {
    const entries = sitemap();
    const competitions = getCompetitions();

    for (const competition of competitions) {
      const hasRealDate = Boolean(competition.verified?.on) || competition.dates.length > 0;
      if (!hasRealDate) continue;
      const entry = entries.find(
        (e) => e.url === `${site.url}/competitions/${competition.id}`,
      );
      expect(entry?.lastModified).toBeDefined();
    }
  });
});
