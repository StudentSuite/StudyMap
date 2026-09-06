"use client";

import { useState } from "react";

import { formatCompetitionDate } from "@/lib/competitions";
import type { CompetitionCountry, CompetitionCountryTrack } from "@/lib/types";
import { COMPETITION_COUNTRY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CountryTrackListProps {
  tracks: CompetitionCountryTrack[];
  /** The country to default the open tab to (e.g. from a signed-in user's profile, see #203/#204). */
  defaultCountry?: CompetitionCountry;
}

/**
 * Real national qualifier pathways into a competition, one country at a
 * time. This is the differentiating section of the whole detail page: no
 * other catalog publishes these stages in a structured way, so it gets its
 * own section rather than being buried in the metadata table.
 *
 * Renders nothing at all when there are no country_tracks, rather than an
 * empty shell.
 */
export function CountryTrackList({ tracks, defaultCountry }: CountryTrackListProps) {
  const initial =
    tracks.find((track) => track.country === defaultCountry)?.country ??
    tracks[0]?.country;
  const [selected, setSelected] = useState<CompetitionCountry | undefined>(initial);

  if (tracks.length === 0) return null;

  const active = tracks.find((track) => track.country === selected) ?? tracks[0];

  return (
    <section aria-labelledby="country-pathways-heading">
      <h2
        id="country-pathways-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Country pathways
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Real national qualifier pathways into this competition, where one exists.
      </p>

      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Choose a country pathway"
      >
        {tracks.map((track) => (
          <button
            key={track.country}
            type="button"
            onClick={() => setSelected(track.country)}
            aria-pressed={track.country === active.country}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
              track.country === active.country
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {COMPETITION_COUNTRY_LABELS[track.country]}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border p-4">
        <a
          href={active.official_url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          {COMPETITION_COUNTRY_LABELS[active.country]} official site
        </a>
        <ol className="mt-3 space-y-3">
          {active.stages.map((stage) => (
            <li key={`${stage.name}-${stage.date}`} className="flex flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
                {stage.name}
                {stage.estimated && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    approximate
                  </span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCompetitionDate(stage.date)}{" "}
                <a
                  href={stage.source_url}
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
      </div>
    </section>
  );
}
