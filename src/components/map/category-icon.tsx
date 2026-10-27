import {
  GraduationCap,
  Landmark,
  Library,
  MapPin,
  Plane,
  type LucideIcon,
} from "lucide-react";

import type { PlaceType } from "@/lib/types";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { cn } from "@/lib/utils";

/** One representative lucide icon per place type. */
const PLACE_TYPE_ICONS: Record<PlaceType, LucideIcon> = {
  library: Library,
  other_places: MapPin,
  airport: Plane,
  sat_centre: GraduationCap,
  foreign_lang_exam_centre: GraduationCap,
  gov_offices: Landmark,
};

export interface CategoryIconProps {
  type: PlaceType;
  className?: string;
}

/**
 * Shared type -> icon mapping for `PlaceType`, coloured via `PLACE_TYPE_COLORS`
 * the same way category-chips.tsx colours its legend dot (inline `style`, since
 * the palette is per-type and data-driven rather than a fixed Tailwind class).
 * A reusable addition alongside the existing colour-dot-only treatment in
 * chips/pins/results; nothing currently wires this in.
 */
export function CategoryIcon({ type, className }: CategoryIconProps) {
  const Icon = PLACE_TYPE_ICONS[type];
  return (
    <Icon
      aria-hidden
      className={cn("size-4", className)}
      style={{ color: PLACE_TYPE_COLORS[type] }}
    />
  );
}
