import type { Metadata } from "next";
import type { ReactNode } from "react";

import { site } from "@/lib/site";
import { getChangelog } from "@/lib/changelog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every notable change to StudyMap, release by release.",
};

/** Renders a changelog bullet's inline `` `code` `` spans as <code> elements. */
function renderItem(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function ChangelogPage() {
  const releases = getChangelog();

  return (
    <>
      <p className="mb-6 text-foreground/80">
        Generated from{" "}
        <a
          href={`${site.repo}/blob/main/CHANGELOG.md`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary hover:underline"
        >
          CHANGELOG.md
        </a>{" "}
        so this page never drifts from the real history.
      </p>
      <div className="space-y-4">
          {releases.map((release) => (
            <Card key={release.version}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>v{release.version}</CardTitle>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {release.date}
                  </Badge>
                </div>
                <CardDescription className="sr-only">
                  Changes in version {release.version}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {release.sections.map((section) => (
                  <div key={section.heading}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {section.heading}
                    </p>
                    <ul className="ml-4 mt-2 list-disc space-y-1.5 text-sm text-foreground/80">
                      {section.items.map((item, i) => (
                        <li key={i}>{renderItem(item)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
      </div>
    </>
  );
}
