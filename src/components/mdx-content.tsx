import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Explicit element styling for MDX content. Used instead of a typography
 * plugin so the look stays in our control and matches the brand tokens.
 */
export const mdxComponents = {
  h1: ({ className, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1
      className={cn(
        "mb-4 font-heading text-3xl font-bold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={cn(
        "mt-8 mb-3 font-heading text-xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className={cn("mt-6 mb-2 text-lg font-semibold", className)} {...props} />
  ),
  p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className={cn("my-4 leading-7 text-foreground/90", className)} {...props} />
  ),
  ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className={cn("my-4 ml-6 list-disc space-y-2", className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className={cn("my-4 ml-6 list-decimal space-y-2", className)} {...props} />
  ),
  li: ({ className, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className={cn("leading-7 text-foreground/90", className)} {...props} />
  ),
  a: ({ href = "", className, ...props }: ComponentPropsWithoutRef<"a">) => {
    const classes = cn(
      "font-medium text-primary underline underline-offset-4 hover:opacity-80",
      className,
    );
    if (href.startsWith("/")) {
      return <Link href={href} className={classes} {...props} />;
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} {...props} />
    );
  },
  blockquote: ({ className, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className={cn(
        "my-4 border-l-2 border-border pl-4 text-muted-foreground italic",
        className,
      )}
      {...props}
    />
  ),
  strong: ({ className, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className={cn("font-semibold text-foreground", className)} {...props} />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => (
    <code
      className={cn("rounded bg-muted px-1.5 py-0.5 text-sm", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }: ComponentPropsWithoutRef<"hr">) => (
    <hr className={cn("my-8 border-border", className)} {...props} />
  ),
  // Fenced code blocks land as `<pre><code>`, with or without a language
  // className depending on whether the fence declares one (` ``` ` vs
  // ` ```ts `) - resetting the inline `code` pill styling via a `pre >
  // code` selector here works either way, instead of trying to detect
  // "is this inline or block" from the code element alone.
  pre: ({ className, ...props }: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-xs leading-relaxed [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-xs",
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-4 overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead
      className={cn("border-b border-border text-xs text-muted-foreground", className)}
      {...props}
    />
  ),
  tr: ({ className, ...props }: ComponentPropsWithoutRef<"tr">) => (
    <tr className={cn("border-b border-border/50 last:border-0", className)} {...props} />
  ),
  th: ({ className, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th className={cn("py-2 pr-4 font-medium", className)} {...props} />
  ),
  td: ({ className, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className={cn("py-2 pr-4 text-foreground/80", className)} {...props} />
  ),
};
