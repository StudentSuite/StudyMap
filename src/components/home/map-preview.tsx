"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Place } from "@/lib/types";
import { MapErrorBoundary } from "@/components/map/map-error-boundary";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
});

/**
 * A non-interactive map snapshot for the landing page. The whole frame is a
 * single link into the full /map experience, so panning and pin popups are
 * disabled to keep it a clean preview.
 */
export function MapPreview({ places }: { places: Place[] }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-card shadow-sm lg:aspect-auto lg:h-full lg:min-h-[460px]">
      <MapErrorBoundary>
        <MapView places={places} interactive={false} zoom={10} />
      </MapErrorBoundary>

      <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-md border border-border bg-background/85 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        Live data, OpenStreetMap
      </div>

      <Link
        href="/map"
        aria-label="Open the full interactive map"
        className="group absolute inset-0 z-[1000] flex items-end justify-end bg-gradient-to-t from-background/75 via-transparent to-transparent p-4 transition-colors hover:from-background/85"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform group-hover:translate-x-0.5">
          Open full map
          <ArrowUpRight className="size-4" />
        </span>
      </Link>
    </div>
  );
}
