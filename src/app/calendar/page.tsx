import type { Metadata } from "next";

import { EXAM_EVENTS } from "@/lib/exam-dates";
import { PageContainer } from "@/components/layout/page-container";
import { CalendarView } from "./CalendarView";

export const metadata: Metadata = {
  title: "Exam Calendar",
  description:
    "Upcoming SAT, IB, and Cambridge IGCSE exam and result dates, sourced from the official boards.",
};

export default function CalendarPage() {
  return (
    <PageContainer>
      <h1 className="font-heading text-3xl font-bold tracking-tight">Exam Calendar</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Upcoming SAT, IB, and Cambridge IGCSE exam windows and result dates. Every
        date links back to the official board source. Provisional entries are
        marked until the board confirms its timetable.
      </p>

      <CalendarView />

      <p className="mt-8 text-xs text-muted-foreground">
        Dates last verified 11 June 2026 against College Board, IBO, and Cambridge
        International. Always confirm with your school or test centre before
        planning. Boards occasionally revise timetables.{" "}
        <span className="font-medium">{EXAM_EVENTS.length} sessions tracked.</span>
      </p>
    </PageContainer>
  );
}
