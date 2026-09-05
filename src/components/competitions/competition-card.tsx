import Link from "next/link";

import { DeadlineCountdown } from "@/components/competitions/deadline-countdown";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  COMPETITION_CATEGORY_LABELS,
  COMPETITION_FORMAT_LABELS,
  COMPETITION_PARTICIPATION_LABELS,
  humanizeRegion,
} from "@/lib/types";
import type { Competition } from "@/lib/types";

interface CompetitionCardProps {
  competition: Competition;
  /** Reference time, threaded down from the server so the deadline countdown hydrates safely. */
  now: Date;
}

/**
 * A single competition in the browse grid: name, organizer, category chip,
 * status/countdown, a clamped description, and four scannable meta pills.
 */
export function CompetitionCard({ competition, now }: CompetitionCardProps) {
  return (
    <Card className="gap-3 px-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold text-foreground">
            {competition.name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {competition.organizer}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {COMPETITION_CATEGORY_LABELS[competition.category]}
        </Badge>
      </div>

      <DeadlineCountdown competition={competition} now={now} />

      <p className="line-clamp-3 text-sm text-foreground/80">{competition.description}</p>

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

      <div className="flex items-center justify-between pt-1">
        {/* Save button with a saved-count lands in #200; nothing renders here until then. */}
        <span />
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
