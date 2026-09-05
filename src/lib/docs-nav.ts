import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  CircleHelp,
  Database,
  Download,
  FileJson,
  Gift,
  GitPullRequest,
  GraduationCap,
  History,
  Layers,
  MapPin,
  MousePointerClick,
  Puzzle,
  Server,
  Trophy,
  Wrench,
} from "lucide-react";

export type DocsGroup = "Guides" | "Awesome Lists" | "Contributing" | "Developers";

/**
 * The one place the group order is stated. The sidebar and the /docs index
 * (list and grid views) all read this instead of each keeping their own copy,
 * so they can't drift out of sync with each other.
 */
export const DOCS_GROUPS: DocsGroup[] = [
  "Guides",
  "Awesome Lists",
  "Contributing",
  "Developers",
];

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
    href: "/docs/map-controls",
    title: "Map Controls",
    description: "Every way to zoom, pan, search, and filter the map, including keyboard equivalents.",
    icon: MousePointerClick,
    iconClassName: "text-primary",
    group: "Guides",
  },
  {
    href: "/docs/calendar",
    title: "Using the Exam Calendar",
    description:
      "Read SAT, IB, and Cambridge IGCSE exam windows and result dates, and add your own personal events.",
    icon: CalendarDays,
    iconClassName: "text-primary",
    group: "Guides",
  },
  {
    href: "/docs/competitions",
    title: "Using the Competitions Catalog",
    description:
      "Search and filter student competitions, read deadlines and country pathways, save the ones you care about, and see them on the calendar.",
    icon: Trophy,
    iconClassName: "text-primary",
    group: "Guides",
  },
  {
    href: "/docs/install",
    title: "Install & Offline Usage",
    description: "Install StudyMap as an app and use it offline: what's cached and how to force a fresh load.",
    icon: Download,
    iconClassName: "text-primary",
    group: "Guides",
  },
  {
    href: "/docs/faq",
    title: "FAQ",
    description:
      "Common questions about StudyMap: data accuracy, reporting wrong info, why a place isn't listed, and accounts.",
    icon: CircleHelp,
    iconClassName: "text-primary",
    group: "Guides",
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
    href: "/docs/data-sources",
    title: "Data Sources & Provenance",
    description:
      "Where the place and exam-centre data comes from, how it's verified, licensing, and known accuracy caveats.",
    icon: Database,
    iconClassName: "text-primary",
    group: "Contributing",
  },
  {
    href: "/docs/data-format",
    title: "Place Data Format",
    description:
      "The JSON schema for data/places/*.json: every field, the id-prefix convention, and the 6 place types.",
    icon: FileJson,
    iconClassName: "text-primary",
    group: "Contributing",
  },
  {
    href: "/docs/architecture",
    title: "Architecture",
    description: "A map of the codebase for new contributors: folder layout, data flow, and key modules.",
    icon: Layers,
    iconClassName: "text-primary",
    group: "Developers",
  },
  {
    href: "/docs/places-api",
    title: "Places API",
    description: "Read the crowdsourced places dataset programmatically: GET /api/places, filters, pagination, and errors.",
    icon: Database,
    iconClassName: "text-primary",
    group: "Developers",
  },
  {
    href: "/docs/competitions-api",
    title: "Competitions API",
    description: "Read the competitions dataset programmatically: GET /api/competitions, filters, pagination, and errors.",
    icon: Trophy,
    iconClassName: "text-primary",
    group: "Developers",
  },
  {
    href: "/docs/self-hosting",
    title: "Self-Hosting Guide",
    description: "Run StudyMap for your own city: fork, configure your region and dataset, and deploy.",
    icon: Server,
    iconClassName: "text-primary",
    group: "Developers",
  },
  {
    href: "/docs/troubleshooting",
    title: "Troubleshooting",
    description: "Common problems when running StudyMap locally or on a fork, and what actually causes them.",
    icon: Wrench,
    iconClassName: "text-primary",
    group: "Developers",
  },
  {
    href: "/docs/changelog",
    title: "Changelog",
    description: "Every notable change to StudyMap, release by release.",
    icon: History,
    iconClassName: "text-primary",
    group: "Developers",
  },
];

/** Same entries, index page excluded — the order sidebar links, groups, and the pager all walk. */
export const docsPages = docsNav.filter((entry) => entry.href !== "/docs");

export function getDocsNavEntry(pathname: string) {
  return docsNav.find((entry) => entry.href === pathname);
}
