"use client";

import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

interface SegmentedProps<T extends string> {
  /** Visible label above the control, also its accessible group name. */
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
}

/** Labeled segmented control: each option is a real button, state in aria-pressed. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex items-center rounded-lg border border-border p-0.5"
      >
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={value === optionValue}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              value === optionValue
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden="true" />}
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
