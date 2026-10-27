"use client";

import { ExternalLink } from "lucide-react";

import type { Place } from "@/lib/types";
import { humanizeCity, PLACE_TYPE_LABELS } from "@/lib/types";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { VerifiedBadge } from "@/components/pins/verified-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PlaceDetailDrawerProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Fuller detail view for one place than the pin popup gives: name, type,
 * city, address, exam (if any), verification, and a direct link out. Opens
 * as a right-side sheet so it can sit alongside the map instead of blocking
 * it, unlike the modal dialogs used for data-entry flows (suggest/report).
 */
export function PlaceDetailDrawer({ place, open, onOpenChange }: PlaceDetailDrawerProps) {
  return (
    <Sheet open={open && place !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {place && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {place.name}
                <VerifiedBadge place={place} />
              </SheetTitle>
              <SheetDescription>{humanizeCity(place.city)}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: PLACE_TYPE_COLORS[place.type] }}
                />
                {PLACE_TYPE_LABELS[place.type]}
              </div>

              {place.address && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Address</p>
                  <p className="text-sm text-foreground">{place.address}</p>
                </div>
              )}

              {place.exam && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Exam centre</p>
                  <p className="text-sm text-foreground">{place.exam}</p>
                </div>
              )}

              <Button asChild className="w-full">
                <a href={place.gmaps_link} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Directions
                </a>
              </Button>

              <p className="text-[11px] text-muted-foreground/75">
                Added by{" "}
                <span className="font-medium text-muted-foreground">
                  {place.added_by}
                </span>
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
