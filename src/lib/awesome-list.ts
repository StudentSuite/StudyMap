export interface AwesomeEntry {
  name: string;
  url: string;
  description: string;
}

export interface AwesomeSection {
  title: string;
  entries: AwesomeEntry[];
}

const HEADING_PATTERN = /^## (.+)/;
const ENTRY_PATTERN = /^- \*\*\[(.+?)\]\((.+?)\)\*\*\s*-\s*(.+)$/;

/**
 * Groups `- **[Name](url)** - description` bullets under their nearest `##`
 * heading. Matches the entry format all 3 StudentSuite awesome-list repos
 * already enforce via their own check-list-format.mjs / update-counts.mjs.
 * Sections with no matching bullets (Table of Contents, Contributing,
 * License, ...) end up empty and are dropped, so no heading skip-list is
 * needed here.
 */
export function parseAwesomeList(readme: string): AwesomeSection[] {
  const sections: AwesomeSection[] = [];
  let current: AwesomeSection | null = null;

  for (const line of readme.split("\n")) {
    const heading = line.match(HEADING_PATTERN);
    if (heading) {
      current = { title: heading[1].trim(), entries: [] };
      sections.push(current);
      continue;
    }
    const entry = line.match(ENTRY_PATTERN);
    if (entry && current) {
      current.entries.push({ name: entry[1], url: entry[2], description: entry[3] });
    }
  }

  return sections.filter((section) => section.entries.length > 0);
}

/**
 * Fetches a StudentSuite awesome-list README and parses it into sections.
 * `revalidate: 86400` (Next.js ISR) means a merge on the source repo shows
 * up here within a day, no redeploy of StudyMap required.
 */
export async function fetchAwesomeList(repo: string): Promise<AwesomeSection[]> {
  const res = await fetch(`https://raw.githubusercontent.com/StudentSuite/${repo}/main/README.md`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${repo} README: ${res.status}`);
  }
  return parseAwesomeList(await res.text());
}
