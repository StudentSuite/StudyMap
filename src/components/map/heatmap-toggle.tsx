"use client";

import { Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeatmapToggleProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  className?: string;
}

/**
 * Toggle control for the places-density heatmap overlay. It flips `pressed`;
 * `places-map.tsx` passes that to `map-view.tsx`, which draws the overlay.
 * Styled to match `NearMeButton` so both sit naturally in the same
 * map-controls stack.
 */
export function HeatmapToggle({
  pressed,
  onPressedChange,
  className,
}: HeatmapToggleProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={pressed ? "default" : "secondary"}
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn("w-full", className)}
    >
      <Flame className="size-4" />
      {pressed ? "Heatmap on" : "Heatmap"}
    </Button>
  );
}
