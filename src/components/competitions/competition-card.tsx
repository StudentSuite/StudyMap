import Link from "next/link";
import { Calendar, Clock, ExternalLink, MapPin, Users } from "lucide-react";

import { DeadlineCountdown } from "@/components/competitions/deadline-countdown";
import { SaveButton } from "@/components/competitions/save-button";
import type { ViewMode } from "@/components/competitions/view-toggle";
import { Badge } from "@/components/ui/badge";
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
  now: Date;
  initialSaved?: boolean;
  initialCount?: number;
  variant?: ViewMode;
}

function officialHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function CompetitionCard({
  competition,
  now,
  initialSaved,
  initialCount,
  variant = "list",
}: CompetitionCardProps) {
  const isGrid = variant === "grid";
  const isFree = competition.fee.amount === 0;
  const officialHost = isGrid ? officialHostname(competition.official_url) : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card transition-colors duration-200 hover:border-primary/40",
        isGrid ? "h-full p-4" : "p-4 sm:p-5",
      )}
    >
      {/* Header: name, organizer, category */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
            {competition.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {competition.organizer}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 bg-secondary text-secondary-foreground"
        >
          {COMPETITION_CATEGORY_LABELS[competition.category]}
        </Badge>
      </div>

      {/* Deadline countdown: prominent placement */}
      <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2.5">
        <DeadlineCountdown
          competition={competition}
          now={now}
          className={cn(!isGrid && "sm:flex sm:items-baseline sm:justify-between sm:gap-4")}
        />
      </div>

      {/* Description */}
      <p
        className={cn(
          "mt-3 text-sm leading-relaxed text-foreground/80",
          isGrid ? "line-clamp-2" : "line-clamp-3",
        )}
      >
        {competition.description}
      </p>

      {/* Meta pills: structured, high-contrast */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-foreground/70">
          <Clock className="size-3" aria-hidden />
          {COMPETITION_FORMAT_LABELS[competition.format]}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-foreground/70">
          <Calendar className="size-3" aria-hidden />
          Age {competition.age_min}-{competition.age_max}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-foreground/70">
          <Users className="size-3" aria-hidden />
          {COMPETITION_PARTICIPATION_LABELS[competition.participation]}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-foreground/70">
          <MapPin className="size-3" aria-hidden />
          {humanizeRegion(competition.region)}
        </span>
        {isFree && (
          <span className="inline-flex items-center rounded-md bg-success-bg px-2 py-1 text-xs font-medium text-success">
            Free
          </span>
        )}
        {!isFree && (
          <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-1 text-xs text-foreground/70">
            {competition.fee.currency} {competition.fee.amount}
          </span>
        )}
      </div>

      {/* Footer: save (+ official site, grid only) + details */}
      <div className={cn("mt-4 flex items-center justify-between", isGrid && "mt-auto")}>
        <div className="flex min-w-0 items-center gap-3">
          <SaveButton
            competitionId={competition.id}
            initialSaved={initialSaved}
            initialCount={initialCount}
          />
          {officialHost && (
            <a
              href={competition.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
              title={competition.official_url}
            >
              <ExternalLink className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{officialHost}</span>
            </a>
          )}
        </div>
        <Link
          href={`/competitions/${competition.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          View details
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
