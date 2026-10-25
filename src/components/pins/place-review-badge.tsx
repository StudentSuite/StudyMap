import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Formats a review count compactly: exact below 1000, otherwise one decimal
 * (dropped when whole) plus a k/m suffix, e.g. 950 -> "950", 5000 -> "5k",
 * 1200 -> "1.2k", 2_300_000 -> "2.3m".
 */
function formatReviewCount(count: number): string {
  const n = Math.max(0, Math.round(count));
  if (n < 1000) return String(n);
  const [divisor, suffix] = n < 1_000_000 ? [1_000, "k"] : [1_000_000, "m"];
  const value = Math.round((n / divisor) * 10) / 10;
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}${suffix}`;
}

export interface PlaceReviewBadgeProps {
  /** 0-5 star rating. */
  rating?: number;
  /** Review count backing the rating. */
  reviewCount?: number;
  className?: string;
}

/**
 * Small star-rating badge for a place card. `rating`/`reviewCount` are explicit
 * props, NOT read off a `Place` object: the schema (data/places.schema.json,
 * `additionalProperties: false`) has no rating fields, since ratings are
 * verified at contribution time but not stored in the dataset. This exists
 * for a future UI layer that sources ratings from elsewhere (e.g. hardcoded
 * on a features/showcase list) and passes them in directly.
 */
export function PlaceReviewBadge({ rating, reviewCount, className }: PlaceReviewBadgeProps) {
  if (rating == null && reviewCount == null) return null;

  let label: string;
  if (rating != null && reviewCount != null) {
    label = `${rating.toFixed(1)} (${formatReviewCount(reviewCount)})`;
  } else if (rating != null) {
    label = rating.toFixed(1);
  } else {
    label = `${formatReviewCount(reviewCount as number)} reviews`;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning",
        className,
      )}
    >
      <Star className="size-3" fill="currentColor" aria-hidden />
      {label}
    </span>
  );
}
