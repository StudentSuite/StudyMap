import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCompetitions } from "@/lib/competitions";
import { CompetitionDetail } from "@/components/competitions/competition-detail";
import { PageContainer } from "@/components/layout/page-container";

const RELATED_COUNT = 3;

// Every competition detail page is decided at build time from the dataset;
// a slug that isn't in it is a 404, never a server-rendered miss.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getCompetitions().map((competition) => ({ slug: competition.id }));
}

interface CompetitionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CompetitionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const competition = getCompetitions().find((c) => c.id === slug);
  if (!competition) return {};

  return {
    title: competition.name,
    description: competition.description,
  };
}

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { slug } = await params;
  const competitions = getCompetitions();
  const competition = competitions.find((c) => c.id === slug);
  if (!competition) notFound();

  const related = competitions
    .filter((c) => c.category === competition.category && c.id !== competition.id)
    .slice(0, RELATED_COUNT);

  // Computed once, server-side, and threaded down as a prop so the deadline
  // countdown's pre-mount render is identical between the server and the
  // client's first paint (see src/components/competitions/deadline-countdown.tsx).
  const now = new Date();

  return (
    <PageContainer width="content" className="max-w-3xl">
      <CompetitionDetail competition={competition} related={related} now={now} />
    </PageContainer>
  );
}
