import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { DocArticleHeader } from "@/components/docs/doc-article-header";
import { DocsDesktopSidebar, DocsMobileNav } from "@/components/docs/docs-sidebar";
import { RelatedDocs } from "@/components/docs/related-docs";
import { DocCtaBlock } from "@/components/docs/doc-cta-block";
import { DocsPager } from "@/components/docs/docs-pager";

/**
 * Shared /docs article chrome: full-bleed header + byline/date/read-time/
 * share row, persistent sidebar on desktop / drawer on mobile, and related
 * docs + a CTA block + a prev-next pager after each page's content.
 * Individual pages return only their body. The /docs index itself lives
 * outside this route group and renders its own lighter header.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocArticleHeader />
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="pt-6 lg:hidden">
          <DocsMobileNav />
        </div>
        <div className="flex gap-8 lg:items-start">
          <DocsDesktopSidebar />
          <PageContainer width="content" className="min-w-0 flex-1 px-0">
            {children}
            <RelatedDocs />
            <DocCtaBlock />
            <DocsPager />
          </PageContainer>
        </div>
      </div>
    </>
  );
}
