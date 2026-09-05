"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import {
  fetchSaveCounts,
  fetchSavedCompetitionIds,
  saveCompetition,
  unsaveCompetition,
} from "@/lib/competition-saves";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Below this, the count is hidden entirely rather than shown as "1" or "2". */
const MIN_VISIBLE_COUNT = 3;

interface SaveButtonProps {
  competitionId: string;
  /**
   * Starting saved state and count. Omit both when the caller hasn't already
   * bulk-fetched them (e.g. a single detail page) and the button should fetch
   * its own; pass them when the caller already has the data for many
   * competitions at once (e.g. the browse grid), so 50 cards don't each make
   * their own round trip for the same `competition_stats` table.
   */
  initialSaved?: boolean;
  initialCount?: number;
  className?: string;
}

/**
 * Save/unsave toggle with the public save count next to it. Renders nothing
 * at all when Supabase isn't configured - self-hosting without it is a
 * first-class path, not an edge case. Signed out, clicking prompts sign-in
 * rather than silently doing nothing. The toggle is optimistic and reverts
 * with a toast on failure.
 */
export function SaveButton({
  competitionId,
  initialSaved,
  initialCount,
  className,
}: SaveButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [count, setCount] = useState(initialCount ?? 0);
  const [pending, setPending] = useState(false);

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

  // Self-fetch only when the caller didn't already provide starting values.
  useEffect(() => {
    if (!supabase || initialCount !== undefined) return;
    fetchSaveCounts()
      .then((counts) => setCount(counts[competitionId] ?? 0))
      .catch(() => {
        /* count is decorative; a failed fetch just leaves it hidden */
      });
  }, [supabase, initialCount, competitionId]);

  useEffect(() => {
    if (!supabase || !user || initialSaved !== undefined) return;
    fetchSavedCompetitionIds()
      .then((ids) => setSaved(ids.includes(competitionId)))
      .catch(() => {
        /* leave the optimistic default (unsaved) rather than guess */
      });
  }, [supabase, user, initialSaved, competitionId]);

  if (!supabase) return null;

  async function handleClick() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pending) return;

    const wasSaved = saved;
    const previousCount = count;
    setPending(true);
    setSaved(!wasSaved);
    setCount(wasSaved ? Math.max(previousCount - 1, 0) : previousCount + 1);

    try {
      if (wasSaved) {
        await unsaveCompetition(competitionId);
      } else {
        await saveCompetition(competitionId);
      }
    } catch {
      setSaved(wasSaved);
      setCount(previousCount);
      toast.error(
        wasSaved
          ? "Couldn't unsave. Please try again."
          : "Couldn't save. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Unsave this competition" : "Save this competition"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-60",
        saved
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn("size-3.5", saved && "fill-current")} aria-hidden="true" />
      {count >= MIN_VISIBLE_COUNT && <span>{count}</span>}
    </button>
  );
}
