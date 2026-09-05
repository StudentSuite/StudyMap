import type { Metadata } from "next";
import Link from "next/link";

import { StepCard } from "@/components/docs/step-card";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "Using the Competitions Catalog",
  description:
    "How to browse StudyMap's student competitions catalog: search and filters, deadlines and country pathways, saving, and the calendar.",
};

export default function CompetitionsGuidePage() {
  return (
    <>
      <p className="mb-6 text-foreground/80">
        The{" "}
        <Link href="/competitions" className="font-medium text-primary hover:underline">
          Competitions
        </Link>{" "}
        catalog is a curated list of student competitions, olympiads and scholarships, each
        with real dates and a link to the organizer&apos;s own site. It is not a submission
        portal or an application tracker - StudyMap never handles entries or applications on
        your behalf. Every record links out to the official competition site for the actual
        submission.
      </p>

      <div className="space-y-0">
        <StepCard
          step={1}
          title="Browse and filter"
          description="Search, category chips, and a filter panel"
        >
          <p>
            Search by name or subject in the search box, or tap a category chip
            (STEM, Coding, Essay Writing, and so on) to narrow the list. Open the
            filter panel for more: format (online, offline, hybrid), individual or
            team participation, region, free entry only, an age range, and a
            deadline window (next 30 or 90 days, or this cycle).
          </p>
          <p>
            Use the list/grid toggle above the results to switch between a dense
            list and a card grid - your choice is remembered on this device.
          </p>
        </StepCard>

        <StepCard
          step={2}
          title="Read deadlines and countdowns"
          description="Every date, and whether it's confirmed"
        >
          <p>
            Each competition&apos;s detail page shows its full timeline -
            registration open/close, submission deadlines, judging rounds,
            results, ceremony - and a live countdown to the next one. A date
            tagged <span className="font-medium">estimated</span> is the
            organizer&apos;s best guess for this cycle, not yet confirmed; treat it
            as a planning date, not a hard deadline, until it&apos;s updated.
          </p>
        </StepCard>

        <StepCard
          step={3}
          title="Check country pathways"
          description="Real national qualifying routes, where one exists"
        >
          <p>
            Some competitions run a country-specific qualifying stage before the
            international round - a national olympiad round that feeds into an
            international one, for example. Where a real pathway exists, the
            detail page&apos;s{" "}
            <span className="font-medium">Country pathways</span> section lists
            its stages with dates and a link to that country&apos;s official
            page. Pick your country from the tabs to see the stages that apply
            to you specifically, not just the international dates.
          </p>
        </StepCard>

        <StepCard
          step={4}
          title="Save competitions you care about"
          description="Sign in to track them across the site"
          isLast
        >
          <p>
            Signed-in users can save a competition from its card or detail page.
            Saved competitions show up on your{" "}
            <Link href="/competitions/saved" className="font-medium text-primary hover:underline">
              Saved
            </Link>{" "}
            page and are what the calendar prioritizes for you (see below). Each
            competition also shows how many people have saved it, but only once
            that count reaches a few - a count of one or two would just identify
            individual savers, so it stays hidden until then.
          </p>
        </StepCard>
      </div>

      <CalloutCard
        title="How the calendar picks what to show you"
        description="Saved-first, never empty"
        className="mt-4"
      >
        <p>
          The{" "}
          <Link href="/calendar" className="font-medium text-primary hover:underline">
            Calendar
          </Link>{" "}
          defaults to your saved competitions once you have at least one, with a
          toggle to see everything instead. If you have no saves yet - signed in
          or not - it shows every competition scoped to a country you choose,
          rather than all of them unfiltered at once.
        </p>
      </CalloutCard>

      <CalloutCard
        title="Get reminders in your own calendar"
        description="Subscribe once, see every saved deadline automatically"
        className="mt-4"
      >
        <p>
          A countdown only helps if you are already looking at the page. On the{" "}
          <Link
            href="/competitions/saved"
            className="font-medium text-primary hover:underline"
          >
            Saved
          </Link>{" "}
          page, signed-in users get a private feed URL (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            /api/competitions/saved.ics?token=...
          </code>
          ) to subscribe to in Google Calendar (Settings &gt; Add calendar &gt; From
          URL) or Apple Calendar (File &gt; New Calendar Subscription). Every saved
          competition&apos;s dates then show up there automatically, kept in sync
          each time your calendar app refreshes the feed. Dates still marked{" "}
          <span className="font-medium">estimated</span> in the catalog appear as
          &quot;approximate&quot; in the event title, never as a confirmed date.
        </p>
        <p className="text-xs text-muted-foreground">
          The link is a bearer credential, like a password - anyone who has it can
          see your saved competitions, so treat it like one. The Saved page has a
          button to get a new link at any time, which immediately stops the old one
          from working.
        </p>
      </CalloutCard>

      <CalloutCard
        title="Contributing a competition"
        description="The catalog is community-maintained"
        className="mt-4"
      >
        <p>
          Know a competition that should be here? See the{" "}
          <a
            href="https://github.com/StudentSuite/StudyMap/blob/main/data/competitions/CONTRIBUTING.md"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            competitions contributing guide
          </a>{" "}
          on GitHub for the record schema, which category file it belongs in, and
          how to open a pull request.
        </p>
      </CalloutCard>

      <CalloutCard
        title="Date wrong or missing?"
        description="This is the fastest way to lose trust in the catalog, so please tell us"
        className="mt-4"
      >
        <p>
          Every date on every competition links to an official source. If a
          deadline has changed, a result date is wrong, or a competition is
          missing entirely, please{" "}
          <a
            href="https://github.com/StudentSuite/StudyMap/issues/new"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            open a GitHub issue
          </a>{" "}
          with a link to the organizer&apos;s own page. A wrong date is the one
          mistake here that costs the most trust, so please report it even if
          you are not sure - we would rather double-check a false alarm than
          leave a wrong date live.
        </p>
      </CalloutCard>
    </>
  );
}
