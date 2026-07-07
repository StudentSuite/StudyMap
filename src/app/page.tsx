import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Hero } from "@/components/home/hero";

const sections = [
  {
    href: "/map",
    label: "The map",
    title: "Find a place near you",
    body: "Filter by city and category, then tap any pin for the address and one-tap directions. Exam centres, libraries, book shops, stationery, cafes, and transit, all in one view.",
    cta: "Open the map",
  },
  {
    href: "/calendar",
    label: "Exam calendar",
    title: "Know the dates that matter",
    body: "Upcoming SAT, IB, and Cambridge IGCSE exam windows and result dates, each linked back to the official board so you can plan travel and revision around them.",
    cta: "View the calendar",
  },
  {
    href: "/docs",
    label: "Docs and guides",
    title: "Student guides worth reading",
    body: "Step-by-step help on claiming the GitHub Student Developer Pack, finding exam centres, and getting the most out of the map.",
    cta: "Read the docs",
  },
  {
    href: "/contribute",
    label: "Contribute",
    title: "Add the places you know",
    body: "Spot a missing library or a centre that moved? Add or fix a place through a quick GitHub issue or pull request. Every entry is reviewed before it lands.",
    cta: "Start contributing",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="kicker">Why StudyMap</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Built by students, for students.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Finding study spots and exam centres takes forever. StudyMap
              consolidates what students actually need into one free,
              open-source map.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button asChild size="sm">
              <Link href="/map">Open Map</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/about">About</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <p className="kicker">What is inside</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Everything in one place.
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <p className="kicker">{section.label}</p>
              <h3 className="mt-2 font-heading text-lg font-semibold tracking-tight text-foreground">
                {section.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {section.cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Open data, maintained by students.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every place is public, sourced, and free to reuse. Help keep it
              accurate for the next student.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/contribute">Contribute a place</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
