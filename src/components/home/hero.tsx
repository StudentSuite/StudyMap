import Link from "next/link";

import { getPlaces } from "@/lib/places";
import { PLACE_TYPES, PLACE_TYPE_LABELS, type PlaceType } from "@/lib/types";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPreview } from "@/components/home/map-preview";
import { HeroParticles } from "@/components/home/hero-particles";

// Full literal class strings so Tailwind's scanner keeps the marker utilities.
const MARKER_DOT: Record<PlaceType, string> = {
  library: "bg-marker-library",
  other_places: "bg-marker-other-places",
  airport: "bg-marker-airport",
  sat_centre: "bg-marker-sat-centre",
  foreign_lang_exam_centre: "bg-marker-foreign-lang-exam-centre",
  gov_offices: "bg-marker-gov-offices",
};

export function Hero() {
  const places = getPlaces();
  const total = places.length;

  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="graph-paper absolute inset-0 -z-10"
        style={{
          maskImage:
            "radial-gradient(ellipse 120% 90% at 50% 0%, black 50%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 120% 90% at 50% 0%, black 50%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <HeroParticles />
      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-10 px-4 pb-16 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-12 lg:pb-24">
        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="kicker">Mumbai &middot; Thane &middot; Navi Mumbai</p>

          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Every place a student needs, on one map.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Exam centres, libraries, book shops, stationery, and the spots that
            actually matter, across the Mumbai Metropolitan Region.
            Crowdsourced, open-source, free.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/map">Open the map</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={site.repo} target="_blank" rel="noreferrer">
                Add a place
              </Link>
            </Button>
          </div>

          <p className="mt-6 font-mono text-xs text-muted-foreground">
            {total} places &middot; {PLACE_TYPES.length}{" "}categories &middot; 3 cities &middot; 100% open data
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2.5">
            {PLACE_TYPES.map((type) => (
              <li
                key={type}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-white/50",
                    MARKER_DOT[type],
                  )}
                />
                {PLACE_TYPE_LABELS[type]}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7">
          <MapPreview places={places} />
        </div>
      </div>
    </section>
  );
}
