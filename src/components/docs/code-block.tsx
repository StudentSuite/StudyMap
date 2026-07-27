"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  className?: string;
}

/**
 * Minimal per-line JSON tint (keys / string values / numbers) using the
 * existing info/success/warning tokens. Written for this one static schema
 * sample, not a general-purpose syntax highlighter.
 */
function highlightJson(code: string) {
  return code.split("\n").map((line, i) => {
    const match = line.match(/^(\s*)("[^"]+")(\s*:\s*)(.*)$/);
    if (!match) return <div key={i}>{line || " "}</div>;
    const [, indent, key, colon, rest] = match;
    const trailingComma = rest.endsWith(",");
    const value = trailingComma ? rest.slice(0, -1) : rest;
    const isString = value.startsWith('"');
    return (
      <div key={i}>
        {indent}
        <span className="text-info">{key}</span>
        {colon}
        <span className={isString ? "text-success" : "text-warning"}>{value}</span>
        {trailingComma && ","}
      </div>
    );
  });
}

export function CodeBlock({ code, className }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <div className={cn("group relative rounded-lg border border-border bg-muted", className)}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied to clipboard" : "Copy code"}
        className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-[0.65rem] text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
        <code>{highlightJson(code)}</code>
      </pre>
    </div>
  );
}
