"use client";

import { PLACE_TYPES, PLACE_TYPE_LABELS } from "@/lib/types";
import type { PlaceType } from "@/lib/types";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  selected: PlaceType[];
  counts: Record<PlaceType, number>;
  onToggle: (type: PlaceType) => void;
  /** When true, lay out as a single horizontally scrolling row (mobile). */
  scroll?: boolean;
}

/**
 * Category filters as colour-coded toggle chips. Each chip doubles as the map
 * legend (colour dot matches the pin) and shows how many of that type are
 * currently visible. Selecting none means everything shows.
 */
export function CategoryChips({
  selected,
  counts,
  onToggle,
  scroll = false,
}: CategoryChipsProps) {
  return (
    <div
      className={cn(
        "gap-1.5",
        scroll
          ? "flex overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-24px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex flex-wrap",
      )}
      role="group"
      aria-label="Filter by place type"
    >
      {PLACE_TYPES.map((type) => {
        const active = selected.includes(type);
        const color = PLACE_TYPE_COLORS[type];
        return (
          <button
            key={type}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(type)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "border-transparent text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            style={
              active
                ? { backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`, boxShadow: `inset 0 0 0 1px ${color}` }
                : undefined
            }
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="whitespace-nowrap">{PLACE_TYPE_LABELS[type]}</span>
            <span className="tabular-nums text-[11px] text-muted-foreground">
              {counts[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
