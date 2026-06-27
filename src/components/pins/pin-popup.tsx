"use client";

import { Link2, Navigation } from "lucide-react";
import { toast } from "sonner";

import type { Place } from "@/lib/types";
import { humanizeCity, PLACE_TYPE_LABELS } from "@/lib/types";
import { directionsUrl, PLACE_TYPE_COLORS } from "@/lib/map";
import { buildShareUrl } from "@/lib/share";

interface PinPopupProps {
  place: Place;
}

function formatValidTill(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PinPopup({ place }: PinPopupProps) {
  function copyLink() {
    const url = buildShareUrl({ types: [], city: null, placeId: place.id });
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy link"));
  }

  return (
    <div className="flex min-w-[200px] max-w-[260px] flex-col gap-3">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {place.name}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: PLACE_TYPE_COLORS[place.type] }}
            />
            <span className="text-muted-foreground">{PLACE_TYPE_LABELS[place.type]}</span>
          </div>
          <span className="text-muted-foreground">{humanizeCity(place.city)}</span>
        </div>
      </div>

      {/* Address */}
      {place.address && (
        <p className="text-xs leading-snug text-muted-foreground">{place.address}</p>
      )}

      {/* Exam centre validity */}
      {place.exam && (
        <div className="rounded-md border border-border/60 bg-muted/50 px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">{place.exam}</span> centre
          {place.valid_till && (
            <> &middot; reconfirm by {formatValidTill(place.valid_till)}</>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href={directionsUrl(place.lat, place.lng)}
          target="_blank"
          rel="noreferrer"
          className="popup-cta flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-white transition-colors"
        >
          <Navigation className="size-3.5" />
          Directions
        </a>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link to this pin"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
        >
          <Link2 className="size-3.5" />
          <span className="ml-1 hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Footer badge */}
      <div className="border-t border-border/30 pt-2">
        <p className="text-[11px] text-muted-foreground/75">Added by <span className="font-medium text-muted-foreground">{place.added_by}</span></p>
      </div>
    </div>
  );
}
