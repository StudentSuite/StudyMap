import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "Privacy & Your Data",
  description:
    "What StudyMap stores when you sign in: saved places, home location, calendar events, competition saves, and how it's protected.",
};

const TABLES: { name: string; stores: string; note?: string }[] = [
  {
    name: "user_places",
    stores: "Private places you've added for yourself - name, type, and coordinates.",
    note: "Never shown on the public map, only to you.",
  },
  {
    name: "user_home",
    stores: "One lat/lng, if you've set a home location (powers \"Near me\" sorting).",
  },
  {
    name: "user_events",
    stores: "Personal calendar events you've added on top of the public exam calendar.",
  },
  {
    name: "competition_saves",
    stores: "Which competitions you've saved - just a list of ids, nothing else.",
  },
  {
    name: "user_profiles",
    stores: "Graduation year and exam board, if you've set them.",
    note: "Used to tailor what the calendar and competitions catalog show you.",
  },
];

export default function PrivacyDataPage() {
  return (
    <>
      <div className="space-y-4">
        <p className="text-foreground/80">
          The map, calendar, and competitions catalog are fully public and need no
          account. Signing in only unlocks a handful of private, per-user features -
          this page is what those store.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>What&apos;s stored, and why</CardTitle>
            <CardDescription>
              Supabase (Postgres) tables, one row per user per item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {TABLES.map((t) => (
                <li key={t.name} className="py-3">
                  <p className="font-medium">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                      {t.name}
                    </code>
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{t.stores}</p>
                  {t.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">{t.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it&apos;s protected</CardTitle>
            <CardDescription>Row-level security, scoped per user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-foreground/80">
            <p>
              Every table above has row-level security enabled, with every policy scoped
              to{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                auth.uid()
              </code>
              . You can only ever read or write your own rows - not even a maintainer can
              query another user&apos;s saved places through the app&apos;s normal API
              surface.
            </p>
            <p>
              Each table&apos;s{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                user_id
              </code>{" "}
              references your Supabase auth account with{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                on delete cascade
              </code>
              : if your account is deleted, every row above is removed with it
              automatically, nothing has to be cleaned up by hand.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password resets</CardTitle>
            <CardDescription>Attempts are rate-limited, not your email itself</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <p>
              Password-reset requests are throttled per email to stop abuse. What&apos;s
              stored for that is a one-way hash of the email address and a timestamp -
              never the address in plain text, and never the password or reset token
              itself.
            </p>
          </CardContent>
        </Card>
      </div>

      <CalloutCard
        title="Want your account and data gone?"
        description="No self-serve delete button yet - email works just as well"
        className="mt-4"
      >
        <p>
          There&apos;s no in-app delete-account flow today. Open an issue on{" "}
          <a
            href="https://github.com/StudentSuite/StudyMap/issues/new"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            GitHub
          </a>{" "}
          or reach the maintainer directly, and the account (and everything tied to it,
          per the cascade above) gets removed.
        </p>
      </CalloutCard>
    </>
  );
}
