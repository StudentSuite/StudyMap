"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BOARD_LABELS,
  EXAM_EVENTS,
  type ExamBoard,
  type ExamEvent,
} from "@/lib/exam-dates";

const BOARDS: ExamBoard[] = ["SAT", "IB", "IGCSE"];

const BOARD_COLORS: Record<ExamBoard, string> = {
  SAT: "#0ea5e9",
  IB: "#8b5cf6",
  IGCSE: "#10b981",
};

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

  const events = getEventsInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  const dayColors: Record<number, string[]> = {};
  for (const ev of events) {
    const days = getActiveDaysForEvent(ev, year, month);
    days.forEach((d) => {
      if (!dayColors[d]) dayColors[d] = [];
      const c = BOARD_COLORS[ev.board];
      if (!dayColors[d].includes(c)) dayColors[d].push(c);
    });
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
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {BOARDS.map((board) => (
          <div key={board} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="size-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: BOARD_COLORS[board] }}
            />
            {BOARD_LABELS[board]}
          </div>
        ))}
      </div>

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
            const isToday = isThisMonth && today.getDate() === day;

            return (
              <div
                key={day}
                className={`aspect-square flex flex-col items-center justify-center gap-1 border-b border-r border-border last:border-r-0 transition-colors
                  ${hasEvent && !isToday ? "bg-primary/5" : ""}
                `}
                title={
                  hasEvent
                    ? events
                        .filter((ev) => getActiveDaysForEvent(ev, year, month).has(day))
                        .map((ev) => ev.session)
                        .join(", ")
                    : undefined
                }
              >
                <span
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium
                    ${isToday ? "bg-primary text-primary-foreground font-bold" : hasEvent ? "text-foreground" : "text-muted-foreground"}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
