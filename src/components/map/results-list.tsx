"use client";

import { MapPinPlus, Navigation, RotateCcw } from "lucide-react";

import type { Place } from "@/lib/types";
import { PLACE_TYPE_LABELS } from "@/lib/types";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { directionsUrl } from "@/lib/map";
import { formatDistance } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/pins/verified-badge";

export interface ResultRow {
  place: Place;
  distanceKm?: number;
}

interface ResultsListProps {
  header: string;
  rows: ResultRow[];
  emptyState: {
    activeFilters: string[];
    onReset: () => void;
    onSuggest: () => void;
  };
  onSelect: (place: Place) => void;
  focusId?: string | null;
  /** Optional expand/collapse control (e.g. "Show all" for the nearest list). */
  toggle?: { label: string; onClick: () => void } | null;
}

/** A scrollable list of places. Clicking a row flies the map to that pin. */
export function ResultsList({
  header,
  rows,
  emptyState,
  onSelect,
  focusId,
  toggle,
}: ResultsListProps) {
  return (
    <div className="flex min-h-[120px] flex-1 flex-col">
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
        <div
          role="status"
          className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center"
        >
          <p className="text-sm font-medium text-foreground">
            {emptyState.activeFilters.length > 0
              ? `No places match ${emptyState.activeFilters.join(" · ")}.`
              : "No places are available in this view yet."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {emptyState.activeFilters.length > 0
              ? "Clear a filter or suggest the place that is missing."
              : "Know a useful place we should add? Suggest it to the maintainers."}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {emptyState.activeFilters.length > 0 && (
              <Button type="button" size="sm" variant="outline" onClick={emptyState.onReset}>
                <RotateCcw className="size-3.5" />
                Clear filters
              </Button>
            )}
            <Button type="button" size="sm" onClick={emptyState.onSuggest}>
              <MapPinPlus className="size-3.5" />
              Suggest a place
            </Button>
          </div>
        </div>
      ) : (
        <ul className="min-h-0 space-y-1 overflow-y-auto">
          {rows.map(({ place, distanceKm }) => (
            <li key={place.id}>
              <div
                className={`group flex items-center gap-2.5 rounded-md px-2 py-2 ${
                  focusId === place.id ? "bg-muted ring-1 ring-border" : "hover:bg-muted"
                }`}
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: PLACE_TYPE_COLORS[place.type] }}
                />
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  aria-current={focusId === place.id ? "true" : undefined}
                  className="min-w-0 flex-1 text-left"
                  title={`${place.name} (${PLACE_TYPE_LABELS[place.type]})`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="block truncate text-sm text-foreground">
                      {place.name}
                    </span>
                    <VerifiedBadge place={place} />
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
