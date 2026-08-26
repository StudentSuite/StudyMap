"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Web Share API where available (mobile mostly), clipboard-copy fallback everywhere else. */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the native share sheet; fall through to no-op
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
      <Share2 className="size-3.5" aria-hidden="true" />
      <span aria-live="polite">{copied ? "Copied!" : "Share"}</span>
    </Button>
  );
}
