import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { StatsExplorer } from "@/components/stats/stats-explorer";
import { StatsTiles } from "@/components/stats/stats-tiles";
import { getCompetitions } from "@/lib/competitions";
import { getPlaces } from "@/lib/places";
import { computeStats } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Stats",
  description:
    "How many places, cities, countries, competitions and contributors are in the StudyMap dataset.",
};

export default function StatsPage() {
  const stats = computeStats(getPlaces(), getCompetitions());

  return (
    <PageContainer>
      <p className="kicker">Stats</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        StudyMap in numbers
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        What the open dataset holds right now: places, cities, countries, competitions and
        the people who added them.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        <StatsTiles stats={stats} />
        <StatsExplorer stats={stats} />
      </div>
    </PageContainer>
  );
}
