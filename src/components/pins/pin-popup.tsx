"use client";

import { Link2, Navigation } from "lucide-react";
import { toast } from "sonner";

import type { Place } from "@/lib/types";
import { CITY_LABELS, PLACE_TYPE_LABELS } from "@/lib/types";
import { directionsUrl, PLACE_TYPE_COLORS } from "@/lib/map";
import { buildShareUrl } from "@/lib/share";

interface PinPopupProps {
  place: Place;
}

export function PinPopup({ place }: PinPopupProps) {
  function copyLink() {
    const url = buildShareUrl({ types: [], cities: [], placeId: place.id });
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Pin link copied"))
      .catch(() => toast.error("Could not copy link"));
  }

  return (
    <div className="flex min-w-[200px] max-w-[240px] flex-col gap-2">
      <div>
        <p className="text-sm font-semibold leading-tight text-foreground">
          {place.name}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: PLACE_TYPE_COLORS[place.type] }}
          />
          <span>{PLACE_TYPE_LABELS[place.type]}</span>
          <span aria-hidden>&middot;</span>
          <span>{CITY_LABELS[place.city]}</span>
        </div>
      </div>

      {place.address && (
        <p className="text-xs leading-snug text-muted-foreground">{place.address}</p>
      )}

      <div className="flex items-center gap-1.5">
        <a
          href={directionsUrl(place.lat, place.lng)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Navigation className="size-3.5" />
          Get directions
        </a>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy a link to this pin"
          className="inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
        >
          <Link2 className="size-3.5" />
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">Added by {place.added_by}</p>
    </div>
  );
}
