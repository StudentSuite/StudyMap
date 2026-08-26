import type { Metadata } from "next";

import { DocsHeader } from "@/components/docs/docs-header";
import { DocsIndexList } from "@/components/docs/docs-index-list";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Docs",
  description: "Student guides for StudyMap and the tools around it.",
};

export default function DocsIndexPage() {
  return (
    <>
      <DocsHeader />
      <PageContainer width="content">
        <DocsIndexList />
      </PageContainer>
    </>
  );
}
