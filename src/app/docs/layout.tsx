import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { DocsHeader } from "@/components/docs/docs-header";
import { DocsDesktopSidebar, DocsMobileNav } from "@/components/docs/docs-sidebar";
import { DocsPager } from "@/components/docs/docs-pager";

/**
 * Shared /docs chrome: full-bleed header (route-derived from docs-nav.ts),
 * persistent sidebar on desktop / drawer on mobile, and a prev-next pager
 * after each page's content. Individual pages return only their body.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocsHeader />
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="pt-6 lg:hidden">
          <DocsMobileNav />
        </div>
        <div className="flex gap-8 lg:items-start">
          <DocsDesktopSidebar />
          <PageContainer width="content" className="min-w-0 flex-1 px-0">
            {children}
            <DocsPager />
          </PageContainer>
        </div>
      </div>
    </>
  );
}
