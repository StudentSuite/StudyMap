import Link from "next/link";

import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/home/hero";

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="kicker">Open source</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Built by students, for students.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every pin is community-contributed and reviewed before it lands.
              Know a place worth adding? Send it in and help the next student
              find it.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href={site.repo} target="_blank" rel="noreferrer">
              Contribute on GitHub
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
