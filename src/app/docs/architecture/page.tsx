import { readFileSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { PageContainer } from "@/components/layout/page-container";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { mdxComponents } from "@/components/mdx-content";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "A map of the codebase for new contributors: folder layout, data flow, and key modules.",
};

/** Strips the leading `# Architecture` heading - DocsPageHeader already renders the title. */
function stripLeadingHeading(markdown: string): string {
  return markdown.replace(/^#\s.+\n+/, "");
}

export default function ArchitecturePage() {
  const raw = readFileSync(join(process.cwd(), "ARCHITECTURE.md"), "utf8");
  const body = stripLeadingHeading(raw);

  return (
    <>
      <DocsPageHeader
        title="Architecture"
        breadcrumbLabel="Architecture"
        description="A map of the codebase for new contributors, rendered directly from ARCHITECTURE.md so it never drifts from the version on GitHub."
      />
      <PageContainer>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdxComponents}>
          {body}
        </ReactMarkdown>
      </PageContainer>
    </>
  );
}
