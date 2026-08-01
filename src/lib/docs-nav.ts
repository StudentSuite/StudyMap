import type { LucideIcon } from "lucide-react";
import { BookOpen, Gift, GitPullRequest, GraduationCap, MapPin, Puzzle } from "lucide-react";

export type DocsGroup = "Guides" | "Awesome Lists" | "Contributing";

export interface DocsNavEntry {
  href: string;
  title: string;
  /** Short teaser: doubles as the /docs index card blurb and the page's header description. */
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  /** Sidebar/index grouping. Omitted only for the /docs index entry itself. */
  group?: DocsGroup;
}

/**
 * Single source of truth for every /docs route: title, blurb, icon, and
 * sidebar group. Read by the docs index grid, the sidebar nav, the
 * full-bleed page header (via docs/layout.tsx), and the prev/next pager,
 * so none of them can drift out of sync with each other.
 */
export const docsNav: DocsNavEntry[] = [
  {
    href: "/docs",
    title: "Docs",
    description:
      "Student guides for StudyMap and the tools around it. The map covers libraries, SAT centres, foreign language exam centres, government offices (passport offices, RTOs, post offices), airports, and other student-relevant places.",
    icon: MapPin,
  },
  {
    href: "/docs/github-student-pack",
    title: "GitHub Student Developer Pack",
    description:
      "Free developer tools worth hundreds of dollars for verified students: cloud credits, domains, IDEs, GitHub Copilot Pro, and more. Full process, start to finish.",
    icon: Gift,
    iconClassName: "text-primary",
    group: "Guides",
  },
  {
    href: "/docs/exam-centres",
    title: "Finding Exam Centres",
    description: "Use the map to locate verified SAT centres and foreign language exam centres worldwide.",
    icon: MapPin,
    iconClassName: "text-marker-sat-centre",
    group: "Guides",
  },
  {
    href: "/docs/contributing",
    title: "Contributing Places",
    description:
      "StudyMap is open-source and community-maintained. Add a missing location or fix stale data with a GitHub issue or a pull request.",
    icon: GitPullRequest,
    iconClassName: "text-primary",
    group: "Contributing",
  },
  {
    href: "/docs/awesome-student-resources",
    title: "Awesome Student Resources",
    description:
      "Curated software, tools, textbooks, and channels for students, synced daily from the awesome-student-resources list.",
    icon: BookOpen,
    iconClassName: "text-primary",
    group: "Awesome Lists",
  },
  {
    href: "/docs/awesome-study-resources",
    title: "Awesome Study Resources",
    description:
      "Curated exam prep, subject-study, and learning-tool resources, synced daily from the awesome-study-resources list.",
    icon: GraduationCap,
    iconClassName: "text-primary",
    group: "Awesome Lists",
  },
  {
    href: "/docs/awesome-skills-plugins",
    title: "Awesome Skills & Plugins",
    description:
      "Curated AI coding agent skills and plugins for students, synced daily from the awesome-skills-plugins-for-students list.",
    icon: Puzzle,
    iconClassName: "text-primary",
    group: "Awesome Lists",
  },
];

/** Same entries, index page excluded — the order sidebar links, groups, and the pager all walk. */
export const docsPages = docsNav.filter((entry) => entry.href !== "/docs");

export function getDocsNavEntry(pathname: string) {
  return docsNav.find((entry) => entry.href === pathname);
}
