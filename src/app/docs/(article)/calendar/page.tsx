import type { Metadata } from "next";
import Link from "next/link";

import { StepCard } from "@/components/docs/step-card";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "Using the Exam Calendar",
  description:
    "How to read StudyMap's exam calendar: SAT, IB, and Cambridge IGCSE windows, result dates, and your own personal events.",
};

export default function CalendarGuidePage() {
  return (
    <>
      <div className="space-y-0">
        <StepCard
          step={1}
          title="Browse exam windows"
          description="Month view with a color-coded legend"
        >
          <p>
            Go to the{" "}
            <Link href="/calendar" className="font-medium text-primary hover:underline">
              Calendar
            </Link>{" "}
            page. Use the arrows on either side of the month name to move between months.
            Each board has its own dot color, shown in the legend above the grid: blue for
            SAT, purple for IB, green for IGCSE.
          </p>
          <p>
            Days with an exam window are highlighted and show a dot for each board in
            session that day. The list below the legend shows every session that month
            with its exam dates, results date, and a link back to the official source
            (College Board, IBO, or Cambridge International).
          </p>
        </StepCard>

        <StepCard
          step={2}
          title="Check for provisional dates"
          description="Some windows aren't confirmed yet"
        >
          <p>
            A session tagged <span className="font-medium">Provisional</span> means the
            board has published an expected window that isn&apos;t officially confirmed
            yet. Results dates marked <span className="font-medium">(expected)</span> are
            estimates based on board guidance, not a confirmed release date.
          </p>
          <p className="text-xs text-muted-foreground">
            Always confirm exam and result dates with your school or test centre before
            making travel or study plans - boards occasionally revise published
            timetables.
          </p>
        </StepCard>

        <StepCard
          step={3}
          title="Add your own events"
          description="Sign in to track personal dates alongside the exam calendar"
          isLast
        >
          <p>
            Signed-in users can add personal events - application deadlines, coaching
            sessions, reminders - that show up on the same calendar with a pink marker,
            under &quot;Your events&quot; for the current month. Tap{" "}
            <span className="font-medium">Add event</span> above the exam list to create
            one, or the pencil icon on an existing event to edit it.
          </p>
          <p className="text-xs text-muted-foreground">
            Personal events are private to your account - they never appear on anyone
            else&apos;s calendar.
          </p>
        </StepCard>
      </div>

      <CalloutCard
        title="Date wrong or missing?"
        description="Help keep the calendar accurate"
        className="mt-4"
      >
        <p>
          If a session is missing, a date has changed, or a provisional window has since
          been confirmed, please{" "}
          <a
            href="https://github.com/StudentSuite/StudyMap/issues/new"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            open a GitHub issue
          </a>{" "}
          with a link to the official board source.
        </p>
      </CalloutCard>
    </>
  );
}
