import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarDays, Gift, GitPullRequest, GraduationCap, History, MapPin, Puzzle, Wrench } from "lucide-react";

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
    href: "/docs/calendar",
    title: "Using the Exam Calendar",
    description:
      "Read SAT, IB, and Cambridge IGCSE exam windows and result dates, and add your own personal events.",
    icon: CalendarDays,
    iconClassName: "text-primary",
  },
  {
    href: "/docs/contributing",
    title: "Contributing Places",
    description:
      "Add a missing location or fix stale data. JSON or GitHub issue, both work.",
    icon: GitPullRequest,
    iconClassName: "text-primary",
  },
  {
    href: "/docs/awesome-student-resources",
    title: "Awesome Student Resources",
    description:
      "Curated software, tools, textbooks, and channels for students, synced daily from the awesome-student-resources list.",
    icon: BookOpen,
    iconClassName: "text-primary",
  },
  {
    href: "/docs/awesome-study-resources",
    title: "Awesome Study Resources",
    description:
      "Curated exam prep, subject-study, and learning-tool resources, synced daily from the awesome-study-resources list.",
    icon: GraduationCap,
    iconClassName: "text-primary",
  },
  {
    href: "/docs/awesome-skills-plugins",
    title: "Awesome Skills & Plugins",
    description:
      "Curated AI coding agent skills and plugins for students, synced daily from the awesome-skills-plugins-for-students list.",
    icon: Puzzle,
    iconClassName: "text-primary",
  },
  {
    href: "/docs/troubleshooting",
    title: "Troubleshooting",
    description:
      "Common problems when running StudyMap locally or on a fork, and what actually causes them.",
    icon: Wrench,
    iconClassName: "text-primary",
  },
  {
    href: "/docs/changelog",
    title: "Changelog",
    description: "Every notable change to StudyMap, release by release.",
    icon: History,
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
