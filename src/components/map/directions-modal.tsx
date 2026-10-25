"use client";

import { ExternalLink, MapPin, Navigation } from "lucide-react";

import type { Place } from "@/lib/types";
import { directionsUrl } from "@/lib/map";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DirectionsModalProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Apple Maps directions deep-link: https://developer.apple.com/documentation/maps_apple_maps_server_api */
function buildAppleMapsUrl(place: Place): string {
  const params = new URLSearchParams({
    daddr: `${place.lat},${place.lng}`,
    q: place.name,
  });
  return `https://maps.apple.com/?${params.toString()}`;
}

/** Generic `geo:` URI - the Android-intent fallback apps register for offline/third-party map apps. */
function buildGeoUri(place: Place): string {
  const label = encodeURIComponent(`${place.lat},${place.lng}(${place.name})`);
  return `geo:${place.lat},${place.lng}?q=${label}`;
}

/**
 * Deep-link picker for opening a place in whichever maps app the visitor
 * actually has installed, instead of assuming Google Maps. Each option
 * closes the dialog once tapped since the destination app takes over.
 */
export function DirectionsModal({ place, open, onOpenChange }: DirectionsModalProps) {
  return (
    <Dialog open={open && place !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {place && (
          <>
            <DialogHeader>
              <DialogTitle>Get directions</DialogTitle>
              <DialogDescription>Open {place.name} in a maps app.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <a
                href={directionsUrl(place.lat, place.lng)}
                target="_blank"
                rel="noreferrer"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Navigation className="size-4 text-muted-foreground" />
                Google Maps
                <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
              </a>
              <a
                href={buildAppleMapsUrl(place)}
                target="_blank"
                rel="noreferrer"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <MapPin className="size-4 text-muted-foreground" />
                Apple Maps
                <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
              </a>
              <a
                href={buildGeoUri(place)}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <MapPin className="size-4 text-muted-foreground" />
                Other maps app
              </a>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
