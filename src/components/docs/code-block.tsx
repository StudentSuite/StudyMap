import { highlightCode } from "@/lib/highlight";
import { CopyButton } from "@/components/docs/copy-button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  /** Shiki grammar name - "bash" for shell snippets, "json" for data examples. */
  lang?: string;
  className?: string;
}

/** Server-rendered syntax highlighting (shiki, dual light/dark theme) plus a copy button. */
export async function CodeBlock({ code, lang = "text", className }: CodeBlockProps) {
  const html = await highlightCode(code, lang);

  return (
    <div className={cn("group relative rounded-lg border border-border", className)}>
      <CopyButton code={code} />
      <div
        className="[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
