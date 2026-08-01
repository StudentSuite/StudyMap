"use client";

import { usePathname } from "next/navigation";

import { getDocsNavEntry } from "@/lib/docs-nav";
import { DocsPageHeader } from "@/components/docs/docs-page-header";

/** Resolves the current /docs route against docs-nav.ts and renders the shared full-bleed header. */
export function DocsHeader() {
  const pathname = usePathname();
  const entry = getDocsNavEntry(pathname);
  if (!entry) return null;

  return (
    <DocsPageHeader
      title={entry.title}
      description={entry.description}
      breadcrumbLabel={entry.href === "/docs" ? undefined : entry.title}
    />
  );
}
