"use client";

import { ClipboardCheck, GraduationCap, Landmark, Library, Plane } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PlaceType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterPreset {
  label: string;
  types: PlaceType[];
  icon: LucideIcon;
}

/**
 * Common filter combos, built from the real `PlaceType`s only (no invented
 * categories). "Exam centres" is the one combo that spans two types -
 * SAT and foreign-language exam centres are both "somewhere a student sits
 * a timed exam", which is a distinct use case from a single-type filter.
 */
const FILTER_PRESETS: FilterPreset[] = [
  { label: "Libraries", types: ["library"], icon: Library },
  { label: "SAT centres", types: ["sat_centre"], icon: GraduationCap },
  {
    label: "Exam centres",
    types: ["sat_centre", "foreign_lang_exam_centre"],
    icon: ClipboardCheck,
  },
  { label: "Govt offices", types: ["gov_offices"], icon: Landmark },
  { label: "Airports", types: ["airport"], icon: Plane },
];

interface FilterPresetsProps {
  onApply: (types: PlaceType[]) => void;
  className?: string;
}

/**
 * One-tap buttons for common filter combos, so a student doesn't have to
 * rebuild "SAT + foreign-lang exam centres" from the category chips every
 * time. Each preset replaces the active type filter with its own list.
 */
export function FilterPresets({ onApply, className }: FilterPresetsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-label="Filter presets"
    >
      {FILTER_PRESETS.map((preset) => {
        const Icon = preset.icon;
        return (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onApply(preset.types)}
          >
            <Icon className="size-3.5" />
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
