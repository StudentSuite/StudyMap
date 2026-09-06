"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { fetchSaveCounts, fetchSavedCompetitionIds } from "@/lib/competition-saves";
import { getCompetitions, sortByNextDate } from "@/lib/competitions";
import { createClient } from "@/lib/supabase/client";
import { isMissingTableError } from "@/lib/utils";
import { CalendarFeedCard } from "@/components/competitions/calendar-feed-card";
import { CompetitionCard } from "@/components/competitions/competition-card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * `/competitions/saved`: the same card component as the browse grid,
 * filtered to the signed-in user's saved ids and sorted by soonest
 * deadline. Client-rendered throughout since it's entirely user-specific,
 * following the same preview-mode / signed-out handling as the map's
 * saved-places panel and src/app/login/login-form.tsx.
 */
export default function SavedCompetitionsPage() {
  const supabase = useMemo(() => createClient(), []);
  const now = useMemo(() => new Date(), []);

  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [savedIds, setSavedIds] = useState<string[] | null>(null);
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    fetchSavedCompetitionIds()
      .then((ids) => {
        setSavedIds(ids);
        setError(null);
      })
      .catch((err) => {
        setSavedIds([]);
        setError(
          isMissingTableError(err)
            ? "This deployment's saved-competitions table isn't set up yet. See SELF-HOSTING.md."
            : "Couldn't load your saved competitions. Try reloading.",
        );
      });
    fetchSaveCounts()
      .then(setSaveCounts)
      .catch(() => {
        /* counts are decorative */
      });
  }, [user]);

  // Self-host / preview mode: Supabase isn't configured, so there's nothing to save.
  if (!supabase) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Saving competitions isn&apos;t available on this deployment. StudyMap is
            running in preview mode without accounts. Browsing competitions works fully
            without signing in.
          </p>
          <Button asChild className="mt-4">
            <Link href="/competitions">Browse competitions</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user === undefined) {
    return (
      <PageContainer width="content" className="max-w-6xl">
        <div aria-hidden="true">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          <Skeleton className="mt-6 h-32 w-full rounded-xl" />
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Sign in to see the competitions you&apos;ve saved.
          </p>
          <Button asChild className="mt-4">
            <Link href="/login?next=/competitions/saved">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const competitions =
    savedIds === null
      ? []
      : sortByNextDate(
          getCompetitions().filter((competition) => savedIds.includes(competition.id)),
          now,
        );

  return (
    <PageContainer width="content" className="max-w-6xl">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Saved competitions
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Competitions you&apos;ve saved, soonest deadline first.
      </p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <CalendarFeedCard />

      {savedIds !== null && competitions.length === 0 ? (
        <div
          role="status"
          className="mt-6 rounded-md border border-dashed border-border bg-muted/30 px-3 py-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            You haven&apos;t saved any competitions yet.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/competitions">Browse competitions</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              now={now}
              initialSaved={true}
              initialCount={saveCounts[competition.id] ?? 0}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
