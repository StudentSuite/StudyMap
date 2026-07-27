import type { Metadata } from "next";
import Link from "next/link";
import { Gift, GitPullRequest, MapPin } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { DocsPageHeader } from "@/components/docs/docs-page-header";

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
    icon: Gift,
    iconClassName: "text-primary",
  },
  {
    href: "/docs/exam-centres",
    title: "Finding Exam Centres",
    description:
      "Use the map to locate verified SAT centres and foreign language exam centres across India and worldwide.",
    icon: MapPin,
    iconClassName: "text-marker-sat-centre",
  },
  {
    href: "/docs/contributing",
    title: "Contributing Places",
    description:
      "Add a missing location or fix stale data. JSON or GitHub issue, both work.",
    icon: GitPullRequest,
    iconClassName: "text-primary",
  },
];

export default function DocsIndexPage() {
  return (
    <>
      <DocsPageHeader
        title="Docs"
        description="Student guides for StudyMap and the tools around it. The map covers libraries, SAT centres, foreign language exam centres, government offices (passport offices, RTOs, post offices), airports, and other student-relevant places."
      />
      <PageContainer>
        <div className="grid gap-4 sm:grid-cols-3">
          {DOCS.map(({ href, title, description, icon: Icon, iconClassName }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <Icon className={`size-5 ${iconClassName}`} aria-hidden="true" />
              <h2 className="font-heading font-semibold text-foreground leading-snug">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <span className="mt-1 text-sm font-medium text-primary group-hover:underline">
                Read guide
              </span>
            </Link>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
