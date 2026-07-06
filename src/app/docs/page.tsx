import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Docs",
  description: "Student guides for StudyMap and the tools around it.",
};

const DOCS = [
  {
    href: "/docs/github-student-pack",
    title: "GitHub Student Developer Pack",
    description:
      "Claim free developer tools worth hundreds of dollars. Step-by-step guide for Indian students.",
  },
  {
    href: "/docs/exam-centres",
    title: "Finding Exam Centres",
    description:
      "Use the map to locate verified SAT centres and foreign language exam centres across India and worldwide.",
  },
  {
    href: "/docs/contributing",
    title: "Contributing Places",
    description:
      "Add a missing location or fix stale data. JSON or GitHub issue, both work.",
  },
];

export default function DocsIndexPage() {
  return (
    <PageContainer>
      <h1 className="font-heading text-3xl font-bold tracking-tight">Docs</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Student guides for StudyMap and the tools around it. The map covers
        libraries, SAT centres, foreign language exam centres, government
        offices (passport offices, RTOs, post offices), airports, and other
        student-relevant places.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {DOCS.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <h2 className="font-heading font-semibold text-foreground leading-snug">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
            <span className="mt-1 text-sm font-medium text-primary group-hover:underline">
              Read guide
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
