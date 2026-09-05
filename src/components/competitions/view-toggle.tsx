"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

function readStoredViewMode(storageKey: string): ViewMode {
  try {
    return window.localStorage.getItem(storageKey) === "grid" ? "grid" : "list";
  } catch {
    // Private browsing or storage disabled: fall back to the default.
    return "list";
  }
}

function writeStoredViewMode(storageKey: string, mode: ViewMode): void {
  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // The choice just won't persist; nothing else to do about it.
  }
}

/**
 * List/grid view preference, persisted to `localStorage` under `storageKey`
 * so different pages (competitions browse, the docs index in #205) don't
 * collide. Always starts on `"list"` and reads the stored value in an
 * effect - never during the initial render - so the server render and the
 * client's first paint agree; the real preference (if any) applies a beat
 * later, trading a possible one-frame flash for zero hydration risk.
 */
export function useViewMode(storageKey: string): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>("list");

  // Mount-only sync from localStorage to avoid an SSR/hydration mismatch,
  // same convention as ThemeToggle's `mounted` flag.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModeState(readStoredViewMode(storageKey));
  }, [storageKey]);

  function setMode(next: ViewMode) {
    setModeState(next);
    writeStoredViewMode(storageKey, next);
  }

  return [mode, setMode];
}

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

/** Two-state segmented list/grid control, each option a labeled real button. */
export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className={cn("inline-flex items-center rounded-lg border border-border p-0.5", className)}
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        title="List view"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          value === "list"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="size-4" aria-hidden="true" />
        List
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        title="Grid view"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          value === "grid"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
        Grid
      </button>
    </div>
  );
}
