"use client";

import * as React from "react";
import { LocateFixed } from "lucide-react";

import type { LatLng } from "@/lib/geo";
import { Button } from "@/components/ui/button";

interface NearMeButtonProps {
  onLocated: (location: LatLng) => void;
  className?: string;
}

export function NearMeButton({ onLocated, className }: NearMeButtonProps) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function locate() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
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
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Allow location access in your browser settings."
            : err.code === err.TIMEOUT
              ? "Location request timed out. Try again."
              : "Your location could not be determined. Try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className={className}>
      <Button
        size="sm"
        variant="secondary"
        className="w-full"
        onClick={locate}
        disabled={busy}
      >
        <LocateFixed className="size-4" />
        {busy ? "Locating..." : "Near me"}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
