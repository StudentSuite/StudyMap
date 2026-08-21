"use client";

import * as React from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { LatLng } from "@/lib/geo";
import { cn } from "@/lib/utils";

interface NearMeFabProps {
  onLocated: (loc: LatLng) => void;
  className?: string;
}

/** Round floating "near me" button for the mobile map, sized for thumb reach. */
export function NearMeFab({ onLocated, className }: NearMeFabProps) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function locate() {
    if (!navigator.geolocation) {
      const message = "Geolocation is not available in this browser.";
      setError(message);
      toast.error(message);
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onLocated({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setBusy(false);
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Allow location access in your browser settings."
            : err.code === err.TIMEOUT
              ? "Location request timed out. Try again."
              : "Your location could not be determined. Try again.";
        setError(message);
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={locate}
        disabled={busy}
        aria-label="Find places near me"
        className={cn(
          "flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:bg-muted active:bg-muted/80 disabled:opacity-70",
          className,
        )}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <LocateFixed className="size-5" />
        )}
      </button>
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
