import Link from "next/link";

import { CountryTrackList } from "@/components/competitions/country-track-list";
import { DeadlineCountdown } from "@/components/competitions/deadline-countdown";
import { SaveButton } from "@/components/competitions/save-button";
import { Badge } from "@/components/ui/badge";
import { formatCompetitionDate } from "@/lib/competitions";
import {
  COMPETITION_CATEGORY_LABELS,
  COMPETITION_FORMAT_LABELS,
  COMPETITION_PARTICIPATION_LABELS,
  humanizeRegion,
} from "@/lib/types";
import type { Competition, CompetitionCountry } from "@/lib/types";

interface CompetitionDetailProps {
  competition: Competition;
  related: Competition[];
  /** Reference time, computed once by the server page so the countdown hydrates safely. */
  now: Date;
  /** The signed-in user's onboarding country answer (#204), if any. */
  defaultCountry?: CompetitionCountry;
}

function formatFee(fee: Competition["fee"]): string {
  if (fee.amount === 0) return "Free";
  return `${fee.currency} ${fee.amount.toLocaleString()}`;
}

/**
 * The full `/competitions/<id>` detail page body: header, status/countdown,
 * description, a registration-facts definition list, the full dates[]
 * timeline (every entry links to its own source), country qualifier
 * pathways when a real one exists, an official-site call to action, and
 * related competitions in the same category.
 */
export function CompetitionDetail({
  competition,
  related,
  now,
  defaultCountry,
}: CompetitionDetailProps) {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {competition.name}
            </h1>
            <Badge variant="secondary">
              {COMPETITION_CATEGORY_LABELS[competition.category]}
            </Badge>
          </div>
          <a
            href={competition.organizer_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {competition.organizer}
          </a>
        </div>
        <SaveButton competitionId={competition.id} />
      </header>

      <DeadlineCountdown competition={competition} now={now} />

      <p className="max-w-2xl text-foreground/80">{competition.description}</p>

      <section aria-labelledby="registration-heading">
        <h2
          id="registration-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Registration
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Format
            </dt>
            <dd className="mt-0.5 text-foreground">
              {COMPETITION_FORMAT_LABELS[competition.format]}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Age
            </dt>
            <dd className="mt-0.5 text-foreground">
              {competition.age_min}-{competition.age_max}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Participation
            </dt>
            <dd className="mt-0.5 text-foreground">
              {COMPETITION_PARTICIPATION_LABELS[competition.participation]}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Location
            </dt>
            <dd className="mt-0.5 text-foreground">
              {humanizeRegion(competition.region)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Entry fee
            </dt>
            <dd className="mt-0.5 text-foreground">{formatFee(competition.fee)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Prize
            </dt>
            <dd className="mt-0.5 text-foreground">{competition.prize}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="timeline-heading">
        <h2
          id="timeline-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Timeline
        </h2>
        <ol className="mt-3 space-y-3 rounded-xl border border-border p-4">
          {competition.dates.map((date, index) => (
            <li key={`${date.label}-${index}`} className="flex flex-col gap-0.5 text-sm">
              <span className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">
                {date.label}
                {date.estimated && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    approximate
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">
                {formatCompetitionDate(date.date)} ({date.timezone}){" "}
                <a
                  href={date.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  source
                </a>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {competition.country_tracks && (
        <CountryTrackList
          tracks={competition.country_tracks}
          defaultCountry={defaultCountry}
        />
      )}

      <section className="rounded-xl border border-border bg-muted/30 p-4 text-center">
        <a
          href={competition.official_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          Visit the official site
        </a>
      </section>

      {related.length > 0 && (
        <nav aria-label="Related competitions" className="border-t border-border pt-8">
          <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Related
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((entry) => (
              <Link
                key={entry.id}
                href={`/competitions/${entry.id}`}
                className="group flex flex-col gap-1.5 rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <span className="font-medium text-foreground">{entry.name}</span>
                <span className="text-sm text-muted-foreground">{entry.organizer}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
