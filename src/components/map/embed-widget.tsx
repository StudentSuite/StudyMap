"use client";

import * as React from "react";
import { Code2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { site } from "@/lib/site";

interface EmbedWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function copy(text: string, label: string) {
  if (!("clipboard" in navigator)) {
    toast.error("Copying isn't supported in this browser");
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error("Could not copy"));
}

/**
 * Generates an <iframe> snippet for the current map view (same filters/city/
 * viewport as whatever's on screen, via the URL's query string) pointed at
 * the chrome-free /embed route. For a school, library, or org site that
 * wants a live, always-current map without building anything themselves.
 */
export function EmbedWidgetDialog({ open, onOpenChange }: EmbedWidgetDialogProps) {
  const search = typeof window === "undefined" ? "" : window.location.search;
  const embedUrl = `${site.url}/embed${search}`;
  const iframeSnippet = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="480"\n  style="border: 1px solid #e5e5e5; border-radius: 12px;"\n  loading="lazy"\n  title="${site.name}"\n></iframe>`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed this map</DialogTitle>
          <DialogDescription>
            Drop a live, always-current map on your own site - whatever filters, city, or
            view are active right now come along with it.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Embed code</p>
            <pre className="max-h-40 min-w-0 overflow-auto rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs">
              {iframeSnippet}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => copy(iframeSnippet, "Embed code")}
            >
              <Copy className="size-3.5" />
              Copy code
            </Button>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Direct link</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted px-2.5 py-1.5 font-mono text-xs">
                {embedUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                onClick={() => copy(embedUrl, "Link")}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </div>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Code2 className="mt-0.5 size-3.5 shrink-0" />
            Public data only - no sign-in, no saved places, nothing account-specific ever
            renders inside the embed.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" asChild>
            <a href={embedUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Preview
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
