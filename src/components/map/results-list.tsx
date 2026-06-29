"use client";

import { Navigation } from "lucide-react";

import type { Place } from "@/lib/types";
import { PLACE_TYPE_LABELS } from "@/lib/types";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { directionsUrl } from "@/lib/map";
import { formatDistance } from "@/lib/geo";

export interface ResultRow {
  place: Place;
  distanceKm?: number;
}

interface ResultsListProps {
  header: string;
  rows: ResultRow[];
  /** Shown when there are no rows (e.g. filters exclude everything). */
  emptyHint: string;
  onSelect: (place: Place) => void;
  /** Optional expand/collapse control (e.g. "Show all" for the nearest list). */
  toggle?: { label: string; onClick: () => void } | null;
}

/** A scrollable list of places. Clicking a row flies the map to that pin. */
export function ResultsList({
  header,
  rows,
  emptyHint,
  onSelect,
  toggle,
}: ResultsListProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between pb-1.5">
        <p className="text-xs font-medium text-muted-foreground">{header}</p>
        {toggle && (
          <button
            type="button"
            onClick={toggle.onClick}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            {toggle.label}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md bg-muted/50 px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <ul className="min-h-0 space-y-1 overflow-y-auto">
          {rows.map(({ place, distanceKm }) => (
            <li key={place.id}>
              <div className="group flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: PLACE_TYPE_COLORS[place.type] }}
                />
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  className="min-w-0 flex-1 text-left"
                  title={`${place.name} (${PLACE_TYPE_LABELS[place.type]})`}
                >
                  <span className="block truncate text-sm text-foreground">
                    {place.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {PLACE_TYPE_LABELS[place.type]}
                    {distanceKm !== undefined && ` · ${formatDistance(distanceKm)}`}
                  </span>
                </button>
                <a
                  href={directionsUrl(place.lat, place.lng)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Directions to ${place.name}`}
                  className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground"
                >
                  <Navigation className="size-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
