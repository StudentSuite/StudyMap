import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/lib/site";
import { getPlaces } from "@/lib/places";
import { PLACE_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why StudyMap exists, how the crowdsourced data stays honest, and who maintains it.",
};

const principles = [
  {
    title: "One map, not ten tabs",
    body: "Exam centres, libraries, book shops, stationery, and the spots students actually use, in one place across Mumbai, Thane, and Navi Mumbai. No login, no app to install.",
  },
  {
    title: "Crowdsourced, in the open",
    body: "Every place was added by a student through a public GitHub contribution. Anyone can add a missing spot or fix stale data, and every change is reviewed before it lands.",
  },
  {
    title: "Open data, sourced",
    body: "The full dataset is public and every entry carries a source. Exam dates link straight back to the official boards. Nothing here is a black box.",
  },
];

export default function AboutPage() {
  const total = getPlaces().length;

  return (
    <PageContainer>
      <p className="kicker">About StudyMap</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        Built by students, for students.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Finding the right exam centre or a quiet place to study used to mean
        digging through forums, group chats, and a dozen browser tabs. StudyMap
        pulls all of it onto one free, open map so the next student does not have
        to start from scratch.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {principles.map(({ title, body }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base leading-snug">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-12 space-y-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Where the data comes from
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
          StudyMap currently tracks {total} places across {PLACE_TYPES.length}{" "}
          categories in the Mumbai Metropolitan Region. Each one is stored as
          plain JSON in the public repository, with a name, location, category,
          and a source link. Entries are added or corrected through pull requests
          and issues, so the map gets more accurate every time a student helps
          out.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Who maintains it
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
          StudyMap is maintained by Anay Dhawan, a student, as an open-source
          project. Questions, corrections, and ideas are always welcome at{" "}
          <a
            href="mailto:dhawansanay@gmail.com"
            className="font-medium text-primary hover:underline"
          >
            dhawansanay@gmail.com
          </a>{" "}
          or on GitHub.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/map">Open the map</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contribute">Contribute a place</Link>
        </Button>
        <Button asChild variant="ghost">
          <a href={site.repo} target="_blank" rel="noreferrer">
            View the source
          </a>
        </Button>
      </div>
    </PageContainer>
  );
}
