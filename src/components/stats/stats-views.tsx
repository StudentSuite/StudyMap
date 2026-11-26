"use client";

import { useState, type ReactNode } from "react";

import { Segmented, type SegmentedOption } from "@/components/ui/segmented";

type StatsView = "data" | "visitors";

const VIEW_OPTIONS: SegmentedOption<StatsView>[] = [
  { value: "data", label: "Data" },
  { value: "visitors", label: "Visitors" },
];

interface StatsViewsProps {
  /** Dataset numbers and breakdown. Shown first. */
  data: ReactNode;
  /** Monthly visitors and page views. */
  visitors: ReactNode;
}

/** Top-level switch for /stats: the dataset by default, the traffic numbers on request. */
export function StatsViews({ data, visitors }: StatsViewsProps) {
  const [view, setView] = useState<StatsView>("data");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex">
        <Segmented label="Stats" value={view} options={VIEW_OPTIONS} onChange={setView} />
      </div>
      {view === "data" ? data : visitors}
    </div>
  );
}
