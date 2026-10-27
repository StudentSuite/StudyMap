"use client";

import { useState } from "react";
import { Check, Copy, MapPin } from "lucide-react";
import { toast } from "sonner";

import type { Place } from "@/lib/types";
import { PLACE_TYPE_LABELS, humanizeCity } from "@/lib/types";
import { site } from "@/lib/site";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/pins/verified-badge";

interface SharePlaceCardProps {
  place: Place;
}

/** Absolute URL that focuses the map on one place, matching the `place` param `parseMapState` reads. */
function buildPlaceUrl(place: Place): string {
  return `${site.url}/map?place=${encodeURIComponent(place.id)}`;
}

/** Plain-text one-liner for pasting into chat apps. */
function buildPlaceText(place: Place): string {
  const parts = [place.name, place.address, place.gmaps_link].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  return parts.join(" - ");
}

async function copy(text: string, successMessage: string) {
  if (!("clipboard" in navigator)) {
    toast.error("Copying isn't supported in this browser");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Could not copy");
  }
}

/** Small card for sharing one place: a focused map link, or a plain-text line for chat apps. */
export function SharePlaceCard({ place }: SharePlaceCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  async function handleCopyLink() {
    await copy(buildPlaceUrl(place), "Link copied");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  }

  async function handleCopyText() {
    await copy(buildPlaceText(place), "Copied as text");
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 1500);
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-foreground">
                {place.name}
              </span>
              <VerifiedBadge place={place} />
            </span>
            <p className="truncate text-xs text-muted-foreground">
              {PLACE_TYPE_LABELS[place.type]} · {humanizeCity(place.city)}
            </p>
            {place.address && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {place.address}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={handleCopyLink}>
            {copiedLink ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copiedLink ? "Copied" : "Copy link"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleCopyText}>
            {copiedText ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copiedText ? "Copied" : "Copy as text"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
