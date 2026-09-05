"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BOARD_LABELS,
  EXAM_EVENTS,
  type ExamBoard,
  type ExamEvent,
} from "@/lib/exam-dates";
import { createClient } from "@/lib/supabase/client";
import { isMissingTableError } from "@/lib/utils";
import {
  fetchUserEvents,
  PERSONAL_EVENT_CATEGORIES,
  type PersonalEvent,
} from "@/lib/user-events";
import { PersonalEventDialog } from "@/components/calendar/personal-event-dialog";
import { getCompetitions } from "@/lib/competitions";
import { fetchSavedCompetitionIds } from "@/lib/competition-saves";
import {
  competitionEvents,
  competitionEventsInMonth,
  competitionsForCountry,
  type CompetitionEvent,
} from "@/lib/competition-events";
import {
  COMPETITION_COUNTRIES,
  COMPETITION_COUNTRY_LABELS,
  type CompetitionCountry,
} from "@/lib/types";
import {
  boardToExamBoards,
  fetchUserProfile,
  profileCompetitionCountry,
} from "@/lib/user-profile";

const BOARDS: ExamBoard[] = ["SAT", "IB", "IGCSE"];

const BOARD_COLORS: Record<ExamBoard, string> = {
  SAT: "#0ea5e9",
  IB: "#8b5cf6",
  IGCSE: "#10b981",
};

const PERSONAL_EVENT_COLOR = "#ec4899";

const COMPETITION_EVENT_COLOR = "#f59e0b";

// Fallback when there's no signed-in profile country to default to (signed
// out, or the profile's country answer was skipped/"Other") - StudyMap's own
// userbase is India-centric.
const DEFAULT_COMPETITION_COUNTRY: CompetitionCountry = "IN";

const PERSONAL_CATEGORY_LABELS = Object.fromEntries(
  PERSONAL_EVENT_CATEGORIES.map((c) => [c.value, c.label]),
);

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  { short: "Su", long: "Sun" },
  { short: "Mo", long: "Mon" },
  { short: "Tu", long: "Tue" },
  { short: "We", long: "Wed" },
  { short: "Th", long: "Thu" },
  { short: "Fr", long: "Fri" },
  { short: "Sa", long: "Sat" },
];

function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getEventsInMonth(year: number, month: number): ExamEvent[] {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  return EXAM_EVENTS.filter((ev) => {
    const start = new Date(ev.examStart + "T00:00:00");
    const end = /^\d{4}-\d{2}-\d{2}$/.test(ev.examEnd)
      ? new Date(ev.examEnd + "T23:59:59")
      : start;
    return start <= monthEnd && end >= monthStart;
  });
}

function isEventPast(ev: ExamEvent, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.examEnd)) return false;
  return new Date(ev.examEnd + "T23:59:59") < now;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPersonalEventsInMonth(
  events: PersonalEvent[],
  year: number,
  month: number,
): PersonalEvent[] {
  return events.filter((ev) => {
    const d = new Date(ev.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function getActiveDaysForEvent(ev: ExamEvent, year: number, month: number): Set<number> {
  const set = new Set<number>();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.examStart)) return set;
  const winStart = new Date(ev.examStart + "T00:00:00");
  const winEnd = /^\d{4}-\d{2}-\d{2}$/.test(ev.examEnd)
    ? new Date(ev.examEnd + "T23:59:59")
    : winStart;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d);
    if (day >= winStart && day <= winEnd) set.add(d);
  }
  return set;
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [user, setUser] = useState<User | null>(null);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Saved competitions: null means "not fetched yet" (signed out, or the
  // fetch hasn't resolved), distinct from an empty array (signed in with
  // zero saves), so the saved-only default only kicks in once we actually
  // know there is at least one save.
  const [savedCompetitionIds, setSavedCompetitionIds] = useState<string[] | null>(null);
  const [showAllCompetitions, setShowAllCompetitions] = useState(false);
  const [competitionCountry, setCompetitionCountry] = useState<CompetitionCountry>(
    DEFAULT_COMPETITION_COUNTRY,
  );

  // The signed-in user's onboarding `board` answer (#204), translated to the
  // exam boards it should default the calendar to. Null means "no usable
  // default" (signed out, no answer, or a board with no matching exam-date
  // data) - same as showing everything, same as today.
  const [profileBoards, setProfileBoards] = useState<ExamBoard[] | null>(null);
  const [showAllBoards, setShowAllBoards] = useState(false);

  // Clear stale events as soon as the signed-in user changes, during render
  // rather than an effect, so there's no stale-data flash.
  const userId = user?.id ?? null;
  if (userId !== lastUserId) {
    setLastUserId(userId);
    setPersonalEvents([]);
    setEventsError(null);
    setSavedCompetitionIds(null);
    setProfileBoards(null);
    setShowAllBoards(false);
  }

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return; // self-host / preview mode: no auth, no personal events
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchSavedCompetitionIds()
      .then(setSavedCompetitionIds)
      .catch(() => setSavedCompetitionIds([]));
  }, [user]);

  // Onboarding-profile defaults (#204): the user's board picks which exam
  // sessions show by default, their country picks the default competition
  // country track. Silently a no-op when there's no profile, no answer, or
  // the table doesn't exist yet on this deployment - the calendar already
  // has a sensible default without it.
  useEffect(() => {
    if (!user) return;
    fetchUserProfile()
      .then((profile) => {
        if (!profile) return;
        setProfileBoards(boardToExamBoards(profile.board));
        const defaultCountry = profileCompetitionCountry(profile.country);
        if (defaultCountry) {
          setCompetitionCountry((current) =>
            current === DEFAULT_COMPETITION_COUNTRY ? defaultCountry : current,
          );
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchUserEvents()
      .then((events) => {
        setPersonalEvents(events);
        setEventsError(null);
      })
      .catch((err) => {
        setPersonalEvents([]);
        setEventsError(
          isMissingTableError(err)
            ? "This deployment's personal-events table isn't set up yet. See SELF-HOSTING.md."
            : "Couldn't load your events. Try reloading.",
        );
      });
  }, [user]);

  function handleSaved(saved: PersonalEvent) {
    setPersonalEvents((prev) => {
      const next = prev.some((e) => e.id === saved.id)
        ? prev.map((e) => (e.id === saved.id ? saved : e))
        : [...prev, saved];
      return [...next].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  function handleDeleted(id: string) {
    setPersonalEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function openAddDialog() {
    setEditingEvent(null);
    setDialogOpen(true);
  }

  function openEditDialog(ev: PersonalEvent) {
    setEditingEvent(ev);
    setDialogOpen(true);
  }

  // A profile board with real exam-date data behind it (IB, IGCSE) narrows
  // the default list; everyone else, and anyone who's flipped the toggle,
  // sees every board - same as before #204.
  const hasBoardFilter = profileBoards !== null;
  const activeBoards = hasBoardFilter && !showAllBoards ? profileBoards! : BOARDS;
  const events = getEventsInMonth(year, month).filter((ev) =>
    activeBoards.includes(ev.board),
  );
  const personalEventsThisMonth = getPersonalEventsInMonth(personalEvents, year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
  const defaultDialogDate = isThisMonth
    ? toIsoDate(today)
    : toIsoDate(new Date(year, month, 1));

  // Signed in with at least one save: default to saved-only, with a toggle
  // to reveal everything (still country-scoped, never all ~50 competitions
  // x their dates unfiltered - see the "density problem" in #201). Everyone
  // else - signed out, or signed in with no saves yet - gets the same
  // country-scoped "all" view, so the calendar is never empty.
  const hasSaves =
    Boolean(user) && savedCompetitionIds !== null && savedCompetitionIds.length > 0;
  const showingSavedOnly = hasSaves && !showAllCompetitions;
  const visibleCompetitions = showingSavedOnly
    ? getCompetitions().filter((c) => savedCompetitionIds!.includes(c.id))
    : competitionsForCountry(getCompetitions(), competitionCountry);
  const competitionEventsThisMonth = competitionEventsInMonth(
    competitionEvents(visibleCompetitions, competitionCountry),
    year,
    month,
  );

  const dayColors: Record<number, string[]> = {};
  for (const ev of events) {
    const days = getActiveDaysForEvent(ev, year, month);
    days.forEach((d) => {
      if (!dayColors[d]) dayColors[d] = [];
      const c = BOARD_COLORS[ev.board];
      if (!dayColors[d].includes(c)) dayColors[d].push(c);
    });
  }

  // Capped to "is there a confirmed one" / "is there an estimated one" per
  // day, regardless of how many events actually land there - a day with 30
  // competition dates on it still shows at most two dots, so a busy month
  // stays legible on a 360px-wide grid.
  const competitionDayMarkers: Record<
    number,
    { confirmed: boolean; estimated: boolean }
  > = {};
  for (const ev of competitionEventsThisMonth) {
    const day = new Date(`${ev.date}T00:00:00`).getDate();
    const marker = competitionDayMarkers[day] ?? { confirmed: false, estimated: false };
    if (ev.estimated) marker.estimated = true;
    else marker.confirmed = true;
    competitionDayMarkers[day] = marker;
  }

  const personalDays = new Set<number>();
  for (const ev of personalEventsThisMonth) {
    personalDays.add(new Date(ev.date + "T00:00:00").getDate());
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const goBack = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };

  const goForward = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="mt-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="font-heading text-xl font-semibold">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={goForward}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Board legend */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {BOARDS.map((board) => (
          <div
            key={board}
            className={`flex items-center gap-1.5 text-sm ${
              activeBoards.includes(board) ? "text-muted-foreground" : "text-muted-foreground/40"
            }`}
          >
            <span
              className="size-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: BOARD_COLORS[board] }}
            />
            {BOARD_LABELS[board]}
          </div>
        ))}
        {hasBoardFilter && (
          <button
            type="button"
            onClick={() => setShowAllBoards((v) => !v)}
            aria-pressed={showAllBoards}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              showAllBoards
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {showAllBoards ? "Showing all boards" : "Showing your board only"}
          </button>
        )}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className="size-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: COMPETITION_EVENT_COLOR }}
          />
          Competitions
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className="size-2.5 flex-shrink-0 rounded-full border-2 bg-transparent"
            style={{ borderColor: COMPETITION_EVENT_COLOR }}
          />
          Estimated date
        </div>
        {user && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="h-0.5 w-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: PERSONAL_EVENT_COLOR }}
            />
            Your events
          </div>
        )}
      </div>

      {/* Competition controls: country scope and (when the user has saves) the saved/all toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Country
          <select
            value={competitionCountry}
            onChange={(event) =>
              setCompetitionCountry(event.target.value as CompetitionCountry)
            }
            className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            aria-label="Country for competition qualifier stages"
          >
            {COMPETITION_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {COMPETITION_COUNTRY_LABELS[country]}
              </option>
            ))}
          </select>
        </label>
        {hasSaves && (
          <button
            type="button"
            onClick={() => setShowAllCompetitions((v) => !v)}
            aria-pressed={showAllCompetitions}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              showAllCompetitions
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {showAllCompetitions
              ? "Showing all competitions"
              : "Showing saved competitions only"}
          </button>
        )}
      </div>

      {/* Personal events for this month */}
      {user && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your events
            </p>
            <Button size="sm" variant="outline" onClick={openAddDialog} className="gap-1">
              <Plus className="size-3.5" />
              Add event
            </Button>
          </div>

          {eventsError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 py-6 text-center text-sm text-destructive">
              {eventsError}
            </p>
          ) : personalEventsThisMonth.length === 0 ? (
            <p className="rounded-lg border border-border py-6 text-center text-sm text-muted-foreground">
              No personal events this month.
            </p>
          ) : (
            personalEventsThisMonth.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="size-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PERSONAL_EVENT_COLOR }}
                  />
                  <p className="font-medium text-foreground">{ev.title}</p>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {PERSONAL_CATEGORY_LABELS[ev.category] ?? ev.category}
                  </Badge>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => openEditDialog(ev)}
                    aria-label={`Edit ${ev.title}`}
                    className="ml-auto"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
                <p className="mt-2 text-sm font-medium">{formatDate(ev.date)}</p>
                {ev.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">{ev.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Events list for this month */}
      <div className="mb-6">
        {events.length === 0 ? (
          <p className="rounded-lg border border-border py-8 text-center text-sm text-muted-foreground">
            No exams this month.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Events this month
            </p>
            {events.map((ev) => {
              const past = isEventPast(ev, today);
              return (
                <div
                  key={ev.id}
                  className={`rounded-lg border border-border p-4 ${past ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="size-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: BOARD_COLORS[ev.board] }}
                    />
                    <p className="font-medium text-foreground">{ev.session}</p>
                    {past ? (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Passed
                      </Badge>
                    ) : (
                      !ev.confirmed && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          Provisional
                        </Badge>
                      )
                    )}
                  </div>

                  <dl className="mt-2.5 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground shrink-0">Exam:</dt>
                      <dd className="font-medium">
                        {ev.examStart === ev.examEnd
                          ? formatDate(ev.examStart)
                          : `${formatDate(ev.examStart)} to ${formatDate(ev.examEnd)}`}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground shrink-0">Results:</dt>
                      <dd className="font-medium">
                        {formatDate(ev.results)}
                        {ev.resultsEstimated && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (expected)
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  {ev.notes && (
                    <p className="mt-2 text-xs text-muted-foreground">{ev.notes}</p>
                  )}

                  <a
                    href={ev.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {ev.source.label}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Competitions list for this month */}
      <div className="mb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Competitions this month
        </p>
        {competitionEventsThisMonth.length === 0 ? (
          <p className="rounded-lg border border-border py-8 text-center text-sm text-muted-foreground">
            {showingSavedOnly
              ? "No saved competitions this month."
              : `No competitions this month for ${COMPETITION_COUNTRY_LABELS[competitionCountry]}.`}
          </p>
        ) : (
          <div className="space-y-3">
            {competitionEventsThisMonth.map((ev: CompetitionEvent) => (
              <div key={ev.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      ev.estimated
                        ? "size-2.5 flex-shrink-0 rounded-full border-2 bg-transparent"
                        : "size-2.5 flex-shrink-0 rounded-full"
                    }
                    style={
                      ev.estimated
                        ? { borderColor: COMPETITION_EVENT_COLOR }
                        : { backgroundColor: COMPETITION_EVENT_COLOR }
                    }
                  />
                  <Link
                    href={`/competitions/${ev.competitionId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {ev.competitionName}
                  </Link>
                  {ev.country && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {COMPETITION_COUNTRY_LABELS[ev.country]}
                    </Badge>
                  )}
                  {ev.estimated && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Estimated
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium">
                  {ev.label} &middot; {formatDate(ev.date)}
                </p>
                <a
                  href={ev.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Source
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 bg-muted/40 border-b border-border">
          {DAY_NAMES.map((d) => (
            <div
              key={d.long}
              className="py-2.5 text-center text-xs font-semibold text-muted-foreground"
            >
              <span className="hidden sm:inline">{d.long}</span>
              <span className="sm:hidden">{d.short}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) {
              return (
                <div
                  key={`empty-${i}`}
                  className="aspect-square border-b border-r border-border bg-muted/10 last:border-r-0"
                />
              );
            }

            const colors = dayColors[day] ?? [];
            const competitionMarker = competitionDayMarkers[day];
            const hasCompetitionEvent = Boolean(competitionMarker);
            const hasEvent = colors.length > 0 || hasCompetitionEvent;
            const hasPersonalEvent = personalDays.has(day);
            const isToday = isThisMonth && today.getDate() === day;
            const titleParts = [
              ...(colors.length > 0
                ? events
                    .filter((ev) => getActiveDaysForEvent(ev, year, month).has(day))
                    .map((ev) => ev.session)
                : []),
              ...(hasCompetitionEvent
                ? competitionEventsThisMonth
                    .filter((ev) => new Date(`${ev.date}T00:00:00`).getDate() === day)
                    .map((ev) => ev.competitionName)
                : []),
              ...(hasPersonalEvent
                ? personalEventsThisMonth
                    .filter((ev) => new Date(ev.date + "T00:00:00").getDate() === day)
                    .map((ev) => ev.title)
                : []),
            ];

            return (
              <div
                key={day}
                className={`relative aspect-square flex flex-col items-center justify-center gap-1 border-b border-r border-border last:border-r-0 transition-colors
                  ${(hasEvent || hasPersonalEvent) && !isToday ? "bg-primary/5" : ""}
                `}
                title={titleParts.length ? titleParts.join(", ") : undefined}
              >
                <span
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium
                    ${isToday ? "bg-primary text-primary-foreground font-bold" : hasEvent || hasPersonalEvent ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  {day}
                </span>
                {isToday && (
                  <span className="text-[9px] font-semibold text-primary leading-none">
                    today
                  </span>
                )}
                {hasEvent && (
                  <div className="flex gap-0.5 justify-center">
                    {colors.map((c, ci) => (
                      <span
                        key={ci}
                        className="rounded-full"
                        style={{ width: 4, height: 4, backgroundColor: c }}
                      />
                    ))}
                    {competitionMarker?.confirmed && (
                      <span
                        className="rounded-full"
                        style={{
                          width: 4,
                          height: 4,
                          backgroundColor: COMPETITION_EVENT_COLOR,
                        }}
                      />
                    )}
                    {competitionMarker?.estimated && (
                      <span
                        className="rounded-full bg-transparent"
                        style={{
                          width: 4,
                          height: 4,
                          border: `1px solid ${COMPETITION_EVENT_COLOR}`,
                        }}
                      />
                    )}
                  </div>
                )}
                {hasPersonalEvent && (
                  <span
                    className="absolute bottom-1 h-0.5 w-3.5 rounded-full"
                    style={{ backgroundColor: PERSONAL_EVENT_COLOR }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {user && (
        <PersonalEventDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          event={editingEvent}
          defaultDate={defaultDialogDate}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
