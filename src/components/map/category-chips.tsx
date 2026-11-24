"use client";

import { PLACE_TYPES, PLACE_TYPE_LABELS } from "@/lib/types";
import type { PlaceType } from "@/lib/types";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { cn } from "@/lib/utils";

/**
 * A multi-type shortcut that single-type chips cannot express: SAT and
 * foreign-language exam centres are both "somewhere a student sits a timed
 * exam". It is the only combo, so it sits in front of the chips instead of in a
 * second filter bar (#352).
 */
export const EXAM_COMBO: readonly PlaceType[] = [
  "sat_centre",
  "foreign_lang_exam_centre",
];

/** True when `selected` is exactly `combo`, in any order. */
export function matchesCombo(
  selected: readonly PlaceType[],
  combo: readonly PlaceType[],
) {
  return (
    selected.length === combo.length && combo.every((type) => selected.includes(type))
  );
}

interface CategoryChipsProps {
  selected: PlaceType[];
  counts: Record<PlaceType, number>;
  onToggle: (type: PlaceType) => void;
  /** Replaces the whole type selection; enables the leading exam-centres chip. */
  onSetTypes?: (types: PlaceType[]) => void;
  /** Clears the type selection; enables the "N selected, Clear" line. */
  onClear?: () => void;
  /** When true, lay out as a single horizontally scrolling row (mobile). */
  scroll?: boolean;
}

/**
 * Category filters as colour-coded toggle chips. Each chip doubles as the map
 * legend (colour dot matches the pin) and shows how many of that type are
 * currently visible. Selecting none means everything shows. The label of every
 * chip is the one used everywhere else for that type (`PLACE_TYPE_LABELS`).
 */
export function CategoryChips({
  selected,
  counts,
  onToggle,
  onSetTypes,
  onClear,
  scroll = false,
}: CategoryChipsProps) {
  const examCount = EXAM_COMBO.reduce((sum, type) => sum + counts[type], 0);
  const examActive = matchesCombo(selected, EXAM_COMBO);

  return (
    <div className="flex flex-col gap-1.5">
      {onClear && selected.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {selected.length} {selected.length === 1 ? "category" : "categories"} selected
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-primary underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
      <div
        className={cn(
          "flex gap-1.5",
          // The right edge fades out and the row ends in padding, so a chip cut
          // off by the panel edge reads as "scroll for more", not as a bug.
          scroll
            ? "overflow-x-auto pb-1 pr-7 [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            : "flex-wrap",
        )}
        role="group"
        aria-label="Filter by place type"
      >
        {onSetTypes && (
          <Chip
            active={examActive}
            color={PLACE_TYPE_COLORS.sat_centre}
            label="All exam centres"
            title={EXAM_COMBO.map((type) => PLACE_TYPE_LABELS[type]).join(" + ")}
            count={examCount}
            onClick={() => onSetTypes(examActive ? [] : [...EXAM_COMBO])}
          />
        )}
        {PLACE_TYPES.map((type) => (
          <Chip
            key={type}
            active={selected.includes(type)}
            color={PLACE_TYPE_COLORS[type]}
            label={PLACE_TYPE_LABELS[type]}
            count={counts[type]}
            onClick={() => onToggle(type)}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  color,
  label,
  title,
  count,
  onClick,
}: {
  active: boolean;
  color: string;
  label: string;
  title?: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors sm:px-3 sm:py-1.5",
        active
          ? "border-transparent text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      style={
        active
          ? {
              backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
              boxShadow: `inset 0 0 0 1px ${color}`,
            }
          : undefined
      }
    >
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="whitespace-nowrap">{label}</span>
      <span className="tabular-nums text-[11px] text-muted-foreground">{count}</span>
    </button>
  );
}
