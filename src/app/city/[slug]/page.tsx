import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  cityPageSlugs,
  findCityPage,
  placesByType,
} from "@/lib/city-pages";
import { getPlaces } from "@/lib/places";
import { placeJsonLdScript } from "@/lib/jsonld";
import { humanizeCity, PLACE_TYPE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";

// Every city page is decided at build time from the dataset; a slug that is
// not in it is a 404, never a server-rendered miss.
export const dynamicParams = false;

const THIN_CITY_MAX_PLACES = 3;

export function generateStaticParams(): { slug: string }[] {
  return cityPageSlugs(getPlaces());
}

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = findCityPage(getPlaces(), slug);
  if (!page) return {};
  const name = humanizeCity(page.city);
  return {
    title: `${name} — student places`,
    description: `Student-important places in ${name}: ${page.places.length} exam centre${page.places.length === 1 ? "" : "s"}, ${page.places.length === 1 ? "library" : "libraries"} and more, on the crowdsourced StudyMap.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const page = findCityPage(getPlaces(), slug);
  if (!page) notFound();

  const name = humanizeCity(page.city);
  const grouped = placesByType(page.places);

  return (
    <PageContainer>
      {page.places.map((place) => (
        <script
          key={place.id}
          type="application/ld+json"
          // One schema.org/Place node per place: real fields only, no
          // placeholders, geo omitted when coordinates are missing (#120).
          dangerouslySetInnerHTML={{ __html: placeJsonLdScript(place) }}
        />
      ))}
      <p className="kicker">Places in</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {name}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {page.places.length} place{page.places.length === 1 ? "" : "s"} in{" "}
        {name}, from the crowdsourced StudyMap dataset. Open one on the map to
        see it in context.
      </p>

      {page.places.length <= THIN_CITY_MAX_PLACES && (
        <Card className="mt-6 bg-secondary/40">
          <CardContent>
            <p className="font-medium">{name} is just getting started.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Know an exam centre, library, or study spot missing from this
              list? Add it — it takes a couple of minutes and helps every
              student searching for {name}.
            </p>
            <Button asChild className="mt-4">
              <Link href="/contribute">Add a place in {name}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 space-y-8">
        {grouped.map(([type, places]) => (
          <section key={type} aria-labelledby={`type-${type}`}>
            <h2
              id={`type-${type}`}
              className="font-heading text-lg font-semibold tracking-tight"
            >
              {PLACE_TYPE_LABELS[type]}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {places.length}
              </span>
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {places.map((place) => (
                <li key={place.id}>
                  <Card size="sm" className="h-full">
                    <CardHeader>
                      <CardTitle>{place.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-2">
                      {place.address && (
                        <span className="text-muted-foreground">
                          {place.address}
                        </span>
                      )}
                      <Link
                        href={`/map?place=${encodeURIComponent(place.id)}`}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Open on map
                      </Link>
                      <a
                        href={place.gmaps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Google Maps
                      </a>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Button asChild variant="outline">
          <Link href="/map">Explore all places on the map</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
