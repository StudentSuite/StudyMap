import type { Metadata } from "next";

import { DocsHeader } from "@/components/docs/docs-header";
import { DocsIndex } from "@/components/docs/docs-index";
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
        <DocsIndex />
      </PageContainer>
    </>
  );
}
