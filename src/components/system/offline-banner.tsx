"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Persistent banner shown while the browser is offline, auto-hiding once
 * back online. Copy matches the existing /offline page and the service
 * worker (scripts/sw.template.js): previously opened pages and cached map
 * tiles still work, nothing else does.
 */
export function OfflineBanner() {
  // useSyncExternalStore (not an effect + setState) - this mirrors a
  // browser API's live value, which is exactly what it's for, and it
  // avoids a hydration mismatch via the server snapshot below.
  const isOffline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-warning/25 bg-warning/10 px-4 py-2 text-center text-sm font-medium text-warning"
    >
      <WifiOff className="size-4" aria-hidden />
      You are offline. Showing cached pages and map data.
    </div>
  );
}
