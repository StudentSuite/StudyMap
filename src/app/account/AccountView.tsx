"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Home, LogOut, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COMPETITION_COUNTRY_LABELS, humanizeCity, PLACE_TYPE_LABELS } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTableError } from "@/lib/utils";
import {
  deleteUserHome,
  deleteUserPlace,
  fetchUserHome,
  fetchUserPlaces,
  type UserHome,
  type UserPlaceRow,
} from "@/lib/user-places";
import {
  deleteUserEvent,
  fetchUserEvents,
  PERSONAL_EVENT_CATEGORIES,
  type PersonalEvent,
} from "@/lib/user-events";
import { fetchUserProfile, type UserProfileRow } from "@/lib/user-profile";

const CATEGORY_LABELS = Object.fromEntries(
  PERSONAL_EVENT_CATEGORIES.map((c) => [c.value, c.label]),
);

function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border bg-card p-6 text-center shadow-sm">
      {children}
    </div>
  );
}

export function AccountView() {
  const router = useRouter();
  const pathname = usePathname();
  const authEnabled = isSupabaseConfigured();

  const [user, setUser] = React.useState<User | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);

  const [places, setPlaces] = React.useState<UserPlaceRow[]>([]);
  const [placesError, setPlacesError] = React.useState<string | null>(null);
  const [confirmingPlaceId, setConfirmingPlaceId] = React.useState<string | null>(null);

  const [home, setHome] = React.useState<UserHome | null>(null);
  const [homeError, setHomeError] = React.useState<string | null>(null);
  const [confirmingHome, setConfirmingHome] = React.useState(false);

  const [events, setEvents] = React.useState<PersonalEvent[]>([]);
  const [eventsError, setEventsError] = React.useState<string | null>(null);
  const [confirmingEventId, setConfirmingEventId] = React.useState<string | null>(null);

  // The onboarding questionnaire (#204) is skippable, so `null` here just
  // means "not fetched yet" until the effect below settles it either way.
  const [profile, setProfile] = React.useState<UserProfileRow | null>(null);

  // Reset per-user state at render time, before the effects below repopulate
  // it, so switching accounts never flashes the previous user's data.
  const [lastUserId, setLastUserId] = React.useState<string | null>(null);
  const userId = user?.id ?? null;
  if (userId !== lastUserId) {
    setLastUserId(userId);
    setPlaces([]);
    setPlacesError(null);
    setHome(null);
    setHomeError(null);
    setEvents([]);
    setEventsError(null);
    setConfirmingPlaceId(null);
    setConfirmingHome(false);
    setConfirmingEventId(null);
    setProfile(null);
  }

  React.useEffect(() => {
    if (!authEnabled) return;
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [authEnabled]);

  React.useEffect(() => {
    if (!user) return;
    fetchUserPlaces()
      .then((rows) => {
        setPlaces(rows);
        setPlacesError(null);
      })
      .catch((err) => {
        setPlaces([]);
        setPlacesError(
          isMissingTableError(err)
            ? "This deployment's saved-places table isn't set up yet. See SELF-HOSTING.md."
            : "Couldn't load your saved places. Try reloading.",
        );
      });
    fetchUserHome()
      .then((row) => {
        setHome(row);
        setHomeError(null);
      })
      .catch((err) => {
        setHome(null);
        setHomeError(
          isMissingTableError(err)
            ? "This deployment's home-location table isn't set up yet. See SELF-HOSTING.md."
            : "Couldn't load your home location. Try reloading.",
        );
      });
    fetchUserEvents()
      .then((rows) => {
        setEvents(rows);
        setEventsError(null);
      })
      .catch((err) => {
        setEvents([]);
        setEventsError(
          isMissingTableError(err)
            ? "This deployment's personal-events table isn't set up yet. See SELF-HOSTING.md."
            : "Couldn't load your events. Try reloading.",
        );
      });
    // Silent on failure (including a missing table on a deployment that
    // hasn't run the #203 migration yet): the profile section below just
    // stays hidden rather than surfacing an error for an optional feature.
    fetchUserProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user]);

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
  }

  async function handleRemovePlace(id: string) {
    try {
      await deleteUserPlace(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setPlacesError("Couldn't remove this place. Try again.");
    } finally {
      setConfirmingPlaceId(null);
    }
  }

  async function handleRemoveHome() {
    try {
      await deleteUserHome();
      setHome(null);
    } catch {
      setHomeError("Couldn't remove your home location. Try again.");
    } finally {
      setConfirmingHome(false);
    }
  }

  async function handleRemoveEvent(id: string) {
    try {
      await deleteUserEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setEventsError("Couldn't remove this event. Try again.");
    } finally {
      setConfirmingEventId(null);
    }
  }

  if (!authEnabled) {
    return (
      <InfoCard>
        <p className="text-sm text-muted-foreground">
          Accounts are not available on this deployment. StudyMap is running in preview
          mode without Supabase configured. The map and calendar work fully without
          signing in.
        </p>
        <Button asChild className="mt-4">
          <Link href="/map">Go to the map</Link>
        </Button>
      </InfoCard>
    );
  }

  if (!authChecked) {
    return (
      <div className="mt-8 space-y-8" aria-hidden="true">
        <Skeleton className="h-16 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <InfoCard>
        <p className="text-sm text-muted-foreground">
          Sign in to see your saved places, home location, and personal calendar events in
          one place.
        </p>
        <Button asChild className="mt-4">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link>
        </Button>
      </InfoCard>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <p className="truncate text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="gap-1.5 shrink-0"
        >
          <LogOut className="size-3.5" />
          Sign out
        </Button>
      </div>

      {/* Saved places */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Saved places
            {places.length > 0 && (
              <span className="ml-1.5 text-muted-foreground">({places.length})</span>
            )}
          </h2>
          <Link href="/map" className="text-xs font-medium text-primary hover:underline">
            Add or edit on the map
          </Link>
        </div>

        <div className="mt-3 space-y-2">
          {placesError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 py-4 text-center text-xs text-destructive">
              {placesError}
            </p>
          ) : places.length === 0 ? (
            <p className="rounded-lg border border-border py-4 text-center text-xs text-muted-foreground">
              No saved places yet.
            </p>
          ) : (
            places.map((place) => (
              <div key={place.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <p className="flex-1 truncate text-sm font-medium text-foreground">
                    {place.name}
                  </p>
                  {confirmingPlaceId === place.id ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => setConfirmingPlaceId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleRemovePlace(place.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setConfirmingPlaceId(place.id)}
                      aria-label={`Remove ${place.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {PLACE_TYPE_LABELS[place.type]}
                  </Badge>
                  <span>{humanizeCity(place.city)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Home location */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Home location</h2>
          <Link href="/map" className="text-xs font-medium text-primary hover:underline">
            {home ? "Edit on the map" : "Set on the map"}
          </Link>
        </div>

        <div className="mt-3">
          {homeError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 py-4 text-center text-xs text-destructive">
              {homeError}
            </p>
          ) : home ? (
            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
              <Home className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {home.label}
              </span>
              {confirmingHome ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setConfirmingHome(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    onClick={handleRemoveHome}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setConfirmingHome(true)}
                  aria-label="Remove home location"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-border py-4 text-center text-xs text-muted-foreground">
              No home location set.
            </p>
          )}
        </div>
      </section>

      {/* Personal calendar events */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Personal calendar events
            {events.length > 0 && (
              <span className="ml-1.5 text-muted-foreground">({events.length})</span>
            )}
          </h2>
          <Link
            href="/calendar"
            className="text-xs font-medium text-primary hover:underline"
          >
            Add or edit on the calendar
          </Link>
        </div>

        <div className="mt-3 space-y-2">
          {eventsError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 py-4 text-center text-xs text-destructive">
              {eventsError}
            </p>
          ) : events.length === 0 ? (
            <p className="rounded-lg border border-border py-4 text-center text-xs text-muted-foreground">
              No personal events yet.
            </p>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="flex-1 truncate text-sm font-medium text-foreground">
                    {ev.title}
                  </p>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[ev.category] ?? ev.category}
                  </Badge>
                  {confirmingEventId === ev.id ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => setConfirmingEventId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleRemoveEvent(ev.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setConfirmingEventId(ev.id)}
                      aria-label={`Remove ${ev.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(ev.date)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Onboarding questionnaire answers (#204) */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <Link
            href={`/onboarding?next=${encodeURIComponent(pathname)}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            {profile ? "Edit answers" : "Complete your profile"}
          </Link>
        </div>

        <div className="mt-3">
          {profile &&
          (profile.graduation_year ||
            profile.board ||
            profile.field ||
            profile.country) ? (
            <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-border p-3 text-xs sm:grid-cols-2">
              {profile.graduation_year && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Graduating</dt>
                  <dd className="font-medium text-foreground">
                    {profile.graduation_year}
                  </dd>
                </div>
              )}
              {profile.board && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Board</dt>
                  <dd className="font-medium text-foreground">{profile.board}</dd>
                </div>
              )}
              {profile.field && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Field</dt>
                  <dd className="font-medium text-foreground">{profile.field}</dd>
                </div>
              )}
              {profile.country && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Country</dt>
                  <dd className="font-medium text-foreground">
                    {profile.country === "Other"
                      ? "Other"
                      : (COMPETITION_COUNTRY_LABELS[profile.country] ?? profile.country)}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="rounded-lg border border-border py-4 text-center text-xs text-muted-foreground">
              You haven&apos;t answered the onboarding questions yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
