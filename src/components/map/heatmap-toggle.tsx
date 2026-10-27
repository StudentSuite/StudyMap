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
 * Toggle control for a places-density heatmap overlay. This is just the
 * control - it flips `pressed` and leaves actually rendering a heatmap
 * layer to `map-view.tsx`, which is out of scope here. Styled to match
 * `NearMeButton` so both sit naturally in the same map-controls stack.
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
