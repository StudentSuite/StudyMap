"use client";

import { useEffect, useState } from "react";
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
import {
  fetchUserEvents,
  PERSONAL_EVENT_CATEGORIES,
  type PersonalEvent,
} from "@/lib/user-events";
import { PersonalEventDialog } from "@/components/calendar/personal-event-dialog";

const BOARDS: ExamBoard[] = ["SAT", "IB", "IGCSE"];

const BOARD_COLORS: Record<ExamBoard, string> = {
  SAT: "#0ea5e9",
  IB: "#8b5cf6",
  IGCSE: "#10b981",
};

const PERSONAL_EVENT_COLOR = "#ec4899";

const PERSONAL_CATEGORY_LABELS = Object.fromEntries(
  PERSONAL_EVENT_CATEGORIES.map((c) => [c.value, c.label]),
);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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

  // Clear stale events as soon as the signed-in user changes, during render
  // rather than an effect, so there's no stale-data flash.
  const userId = user?.id ?? null;
  if (userId !== lastUserId) {
    setLastUserId(userId);
    setPersonalEvents([]);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUserEvents()
      .then(setPersonalEvents)
      .catch(() => setPersonalEvents([]));
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

  const events = getEventsInMonth(year, month);
  const personalEventsThisMonth = getPersonalEventsInMonth(personalEvents, year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
  const defaultDialogDate = isThisMonth
    ? toIsoDate(today)
    : toIsoDate(new Date(year, month, 1));

  const dayColors: Record<number, string[]> = {};
  for (const ev of events) {
    const days = getActiveDaysForEvent(ev, year, month);
    days.forEach((d) => {
      if (!dayColors[d]) dayColors[d] = [];
      const c = BOARD_COLORS[ev.board];
      if (!dayColors[d].includes(c)) dayColors[d].push(c);
    });
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
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const goForward = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
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
          <div key={board} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="size-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: BOARD_COLORS[board] }}
            />
            {BOARD_LABELS[board]}
          </div>
        ))}
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

          {personalEventsThisMonth.length === 0 ? (
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
            {events.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="size-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: BOARD_COLORS[ev.board] }}
                  />
                  <p className="font-medium text-foreground">{ev.session}</p>
                  {!ev.confirmed && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Provisional
                    </Badge>
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
                        <span className="ml-1 text-xs text-muted-foreground">(expected)</span>
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
            const hasEvent = colors.length > 0;
            const hasPersonalEvent = personalDays.has(day);
            const isToday = isThisMonth && today.getDate() === day;
            const titleParts = [
              ...(hasEvent
                ? events
                    .filter((ev) => getActiveDaysForEvent(ev, year, month).has(day))
                    .map((ev) => ev.session)
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
