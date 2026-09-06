import type { Metadata } from "next";

import { getCompetitions } from "@/lib/competitions";
import { parseCompetitionFilters } from "@/lib/competitions-share";
import { CompetitionsBrowser } from "@/components/competitions/competitions-browser";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "Browse student competitions worldwide: STEM olympiads, essay contests, hackathons, business challenges and more, with deadlines and country qualifier tracks.",
};

interface CompetitionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CompetitionsPage({ searchParams }: CompetitionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === "string") params.set(key, value);
  }

  const competitions = getCompetitions();
  const initialFilters = parseCompetitionFilters(`?${params.toString()}`);
  // Computed once, server-side, and threaded down as a prop rather than
  // having the client independently call `new Date()`: that guarantees the
  // sort order and every deadline countdown agree between the server render
  // and the client's first paint (see src/components/competitions/deadline-countdown.tsx).
  const now = new Date();

  return (
    <PageContainer width="content" className="max-w-6xl">
      <div className="border-b border-border pb-5">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Competitions
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {competitions.length} student competitions worldwide, from STEM olympiads to
          essay contests to hackathons. Every deadline links back to its source, and
          country qualifier tracks are called out where a real national pathway exists.
        </p>
      </div>

      <div className="mt-8">
        <CompetitionsBrowser
          competitions={competitions}
          nowIso={now.toISOString()}
          initialFilters={initialFilters}
        />
      </div>
    </PageContainer>
  );
}
