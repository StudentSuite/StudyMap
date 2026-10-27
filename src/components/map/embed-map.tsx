"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import type { Place } from "@/lib/types";
import { cityBounds, filterPlaces } from "@/lib/places";
import { parseMapState } from "@/lib/share";
import { site } from "@/lib/site";
import studyMapConfig from "../../../studymap.config";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" aria-hidden />,
});

interface EmbedMapProps {
  places: Place[];
}

/**
 * The chrome-free map rendered inside /embed - no navbar, no sidebar, no
 * sign-in. Reads the same `city`/`types`/`lat`/`lng`/`zoom` query params as
 * the full /map share links (see lib/share.ts), so a snippet copied from
 * the full map's "Share" button already works as an embed URL. Public
 * places only - private/saved places never enter this component.
 */
export function EmbedMap({ places }: EmbedMapProps) {
  const state = React.useMemo(
    () => parseMapState(typeof window === "undefined" ? "" : window.location.search),
    [],
  );

  const visible = React.useMemo(
    () =>
      filterPlaces(places, { types: state.types, city: state.city, query: state.query }),
    [places, state.types, state.city, state.query],
  );

  const focusBounds = React.useMemo(
    () => (state.city ? cityBounds(places, state.city) : null),
    [places, state.city],
  );

  const linkBackHref = `/map${typeof window !== "undefined" ? window.location.search : ""}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <MapView
          places={visible}
          userLocation={null}
          focusId={state.placeId}
          focusBounds={focusBounds}
          closePopupTrigger={0}
          center={
            state.lat !== null && state.lng !== null ? [state.lat, state.lng] : undefined
          }
          zoom={state.zoom ?? studyMapConfig.defaultZoom}
        />
      </div>
      <Link
        href={linkBackHref}
        target="_blank"
        rel="noreferrer"
        className="flex h-7 shrink-0 items-center justify-center bg-card text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {visible.length} {visible.length === 1 ? "place" : "places"} · View on {site.name}{" "}
        ↗
      </Link>
    </div>
  );
}
