import Link from "next/link";

import { docsPages } from "@/lib/docs-nav";
import { getDocMeta } from "@/lib/docs-meta";
import { Badge } from "@/components/ui/badge";

/**
 * Vertical list, not the old icon-card grid: group tag + date + read time +
 * title + excerpt per row. docsPages' array order is already grouped
 * (Guides -> Awesome Lists -> Contributing -> Developers), so rows read as
 * loosely clustered by topic with no extra sort logic.
 */
export function DocsIndexList() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col divide-y divide-border">
      {docsPages.map((entry) => {
        const { date, readTime } = getDocMeta(entry.href);
        return (
          <Link
            key={entry.href}
            href={entry.href}
            className="group flex flex-col gap-2 py-6 first:pt-0"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {entry.group && <Badge variant="secondary">{entry.group}</Badge>}
              {date && <time>{date}</time>}
              <span>{readTime}</span>
            </div>
            <h2 className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
              {entry.title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {entry.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
