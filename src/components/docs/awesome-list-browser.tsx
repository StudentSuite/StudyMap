"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalloutCard } from "@/components/docs/callout-card";
import { cn } from "@/lib/utils";
import type { AwesomeSection } from "@/lib/awesome-list";

interface AwesomeListBrowserProps {
  sections: AwesomeSection[];
  repoName: string;
  repoUrl: string;
}

/**
 * Search + section-filter table for an awesome-list docs page. Replaces a
 * plain scroll-through-every-section layout with the map's own interaction
 * language (filter, then scan), which matters once a list crosses ~100
 * entries (awesome-study-resources has 193).
 */
export function AwesomeListBrowser({ sections, repoName, repoUrl }: AwesomeListBrowserProps) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const rows = useMemo(
    () => sections.flatMap((section) => section.entries.map((entry) => ({ ...entry, section: section.title }))),
    [sections],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (activeSection && row.section !== activeSection) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || row.description.toLowerCase().includes(q);
    });
  }, [rows, query, activeSection]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources..."
            className="h-9 pl-8"
            aria-label="Search resources"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {rows.length} resources
        </p>
      </div>

      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0"
        role="group"
        aria-label="Filter by section"
      >
        <button
          type="button"
          onClick={() => setActiveSection(null)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            activeSection === null
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
          aria-pressed={activeSection === null}
        >
          All ({rows.length})
        </button>
        {sections.map((section) => (
          <button
            key={section.title}
            type="button"
            onClick={() => setActiveSection(section.title)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeSection === section.title
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
            aria-pressed={activeSection === section.title}
          >
            {section.title} ({section.entries.length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="w-2/5 px-4 py-2.5 font-medium sm:w-1/4">
                Name
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Description
              </th>
              <th scope="col" className="hidden w-1/4 px-4 py-2.5 font-medium sm:table-cell">
                Section
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row, index) => (
              <tr key={`${row.section}::${row.url}::${index}`} className="align-top">
                <td className="break-words px-4 py-3 font-medium">
                  <a href={row.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {row.name}
                  </a>
                </td>
                <td className="break-words px-4 py-3 text-foreground/80">{row.description}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Badge variant="outline" className="h-auto whitespace-normal text-left">
                    {row.section}
                  </Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  No resources match &quot;{query}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CalloutCard title="Want to add a resource?" description="This list lives in its own repo, not here">
        <p>
          Suggestions and corrections go on the source repo, not StudyMap. Open a pull request
          there and this page picks it up automatically, no StudyMap deploy needed.
        </p>
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          {repoName} on GitHub
        </a>
      </CalloutCard>
    </div>
  );
}
