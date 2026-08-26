import { readFileSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdxComponents}>
      {body}
    </ReactMarkdown>
  );
}
