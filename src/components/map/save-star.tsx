"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** What the star buttons need from whoever owns the saved list (the map page). */
export interface SavedPlacesApi {
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
}

const SavedPlacesContext = React.createContext<SavedPlacesApi | null>(null);

/** Gives every star below it the saved list. Outside it (embeds, previews) stars simply do not render. */
export const SavedPlacesProvider = SavedPlacesContext.Provider;

interface SaveStarProps {
  placeId: string;
  placeName: string;
  className?: string;
  /** Larger touch target for the results list on a phone. */
  touch?: boolean;
}

/**
 * The star that saves a public place to the visitor's shortlist (#355). It is
 * a toggle button, so a screen reader hears whether it is pressed, and its
 * name says which place it acts on.
 */
export function SaveStar({
  placeId,
  placeName,
  className,
  touch = false,
}: SaveStarProps) {
  const saved = React.useContext(SavedPlacesContext);
  if (!saved) return null;
  const active = saved.isSaved(placeId);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${placeName} from saved` : `Save ${placeName}`}
      onClick={(event) => {
        event.stopPropagation();
        saved.toggle(placeId);
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground",
        touch ? "min-h-11 min-w-11 p-2 lg:min-h-0 lg:min-w-0" : "p-2",
        active && "text-amber-500 hover:text-amber-500",
        className,
      )}
    >
      <Star className="size-4" fill={active ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}
