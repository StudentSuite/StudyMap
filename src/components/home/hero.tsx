import Link from "next/link";

import { getCities, getPlaces } from "@/lib/places";
import { PLACE_TYPES } from "@/lib/types";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { MapPreview } from "@/components/home/map-preview";
import { HeroParticles } from "@/components/home/hero-particles";

export function Hero() {
  const places = getPlaces();
  const total = places.length;
  const cityCount = getCities(places).length;
  const stats = `${total} places · ${PLACE_TYPES.length} categories · ${cityCount} cities · 100% open data`;

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
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:pt-20 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Every place a student needs, on one map.
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            SAT centres, libraries, and the spots that actually matter. Crowdsourced,
            open-source, free.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/map">Open the map</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={site.repo} target="_blank" rel="noreferrer">
                Add a place
              </Link>
            </Button>
          </div>

          <p className="mt-4 font-mono text-xs text-muted-foreground">{stats}</p>
        </div>

        <div className="mt-10 md:mt-14">
          <MapPreview places={places} />
        </div>
      </div>
    </section>
  );
}
