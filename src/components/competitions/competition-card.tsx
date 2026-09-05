import Link from "next/link";

import { DeadlineCountdown } from "@/components/competitions/deadline-countdown";
import { SaveButton } from "@/components/competitions/save-button";
import type { ViewMode } from "@/components/competitions/view-toggle";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  COMPETITION_CATEGORY_LABELS,
  COMPETITION_FORMAT_LABELS,
  COMPETITION_PARTICIPATION_LABELS,
  humanizeRegion,
} from "@/lib/types";
import type { Competition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CompetitionCardProps {
  competition: Competition;
  /** Reference time, threaded down from the server so the deadline countdown hydrates safely. */
  now: Date;
  /**
   * Starting save state/count, when the caller already bulk-fetched them for
   * many cards at once (see competitions-browser.tsx). Omit to let the save
   * button fetch its own.
   */
  initialSaved?: boolean;
  initialCount?: number;
  /**
   * "list" (default): full width, description clamped to 3 lines, countdown
   * on the right. "grid": narrower cards in a row, description clamped to 2
   * lines, countdown under the title, footer pinned to the bottom so cards
   * in the same row stay equal height regardless of description length.
   */
  variant?: ViewMode;
}

/**
 * A single competition: name, organizer, category chip, status/countdown, a
 * clamped description, and four scannable meta pills. One component for
 * both the list and grid layouts (a `variant` prop), not two that drift
 * apart - see #202.
 */
export function CompetitionCard({
  competition,
  now,
  initialSaved,
  initialCount,
  variant = "list",
}: CompetitionCardProps) {
  const isGrid = variant === "grid";

  const description = (
    <p className={cn("text-sm text-foreground/80", isGrid ? "line-clamp-2" : "line-clamp-3")}>
      {competition.description}
    </p>
  );

  return (
    <Card className={cn("gap-3 px-4", isGrid && "h-full")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold text-foreground">
            {competition.name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{competition.organizer}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {COMPETITION_CATEGORY_LABELS[competition.category]}
        </Badge>
      </div>

      {isGrid ? (
        <>
          <DeadlineCountdown competition={competition} now={now} />
          {description}
        </>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {description}
          <DeadlineCountdown
            competition={competition}
            now={now}
            className="shrink-0 sm:text-right"
          />
        </div>
      )}

      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <dt className="font-medium text-foreground/70">Format</dt>
          <dd>{COMPETITION_FORMAT_LABELS[competition.format]}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="font-medium text-foreground/70">Age</dt>
          <dd>
            {competition.age_min}-{competition.age_max}
          </dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="font-medium text-foreground/70">Participation</dt>
          <dd>{COMPETITION_PARTICIPATION_LABELS[competition.participation]}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="font-medium text-foreground/70">Location</dt>
          <dd>{humanizeRegion(competition.region)}</dd>
        </div>
      </dl>

      <div className={cn("flex items-center justify-between pt-1", isGrid && "mt-auto")}>
        <SaveButton
          competitionId={competition.id}
          initialSaved={initialSaved}
          initialCount={initialCount}
        />
        <Link
          href={`/competitions/${competition.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View details
        </Link>
      </div>
    </Card>
  );
}
