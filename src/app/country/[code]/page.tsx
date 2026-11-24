import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { placesByType } from "@/lib/city-pages";
import {
  countryMetaDescription,
  countryPageSlugs,
  findCountryPage,
  topPlaces,
} from "@/lib/country-pages";
import { countryJsonLdScript } from "@/lib/jsonld";
import { getPlaces } from "@/lib/places";
import { mapStateToSearch } from "@/lib/share";
import { humanizeCity, PLACE_TYPE_LABELS } from "@/lib/types";
import type { PlaceType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";

// Every country page is decided at build time from the dataset; a code that is
// not in it (or not in its one canonical lowercase form) is a 404, never a
// server-rendered miss.
export const dynamicParams = false;

export function generateStaticParams(): { code: string }[] {
  return countryPageSlugs(getPlaces());
}

interface CountryPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { code } = await params;
  const page = findCountryPage(getPlaces(), code);
  if (!page) return {};
  return {
    title: `${page.name} — student places`,
    description: countryMetaDescription(page),
  };
}

/** A /map link filtered to this country, and to one category when given. */
function mapHref(country: string, type?: PlaceType): string {
  return `/map${mapStateToSearch({
    types: type ? [type] : [],
    city: null,
    country,
    query: "",
    placeId: null,
    lat: null,
    lng: null,
    zoom: null,
  })}`;
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { code } = await params;
  const page = findCountryPage(getPlaces(), code);
  if (!page) notFound();

  const grouped = placesByType(page.places);
  const start = topPlaces(page.places);

  return (
    <PageContainer>
      <script
        type="application/ld+json"
        // A Country with an ItemList of its cities; real names and counts only.
        dangerouslySetInnerHTML={{ __html: countryJsonLdScript(page) }}
      />
      <p className="kicker">Places in</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {page.name}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {page.places.length} place{page.places.length === 1 ? "" : "s"} across{" "}
        {page.cities.length} {page.cities.length === 1 ? "city" : "cities"} in {page.name}
        , from the crowdsourced StudyMap dataset.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>By category</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {grouped.map(([type, places]) => (
              <li key={type}>
                <Link
                  href={mapHref(page.code, type)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="font-semibold tabular-nums">{places.length}</span>
                  {PLACE_TYPE_LABELS[type]}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <section className="mt-8" aria-labelledby="country-cities">
        <h2
          id="country-cities"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Cities
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {page.cities.length}
          </span>
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {page.cities.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/city/${entry.slug}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="font-medium">{humanizeCity(entry.city)}</span>
                <span className="tabular-nums text-muted-foreground">{entry.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="country-start">
        <h2
          id="country-start"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Start here
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {start.map((place) => (
            <li key={place.id}>
              <Card size="sm" className="h-full">
                <CardHeader>
                  <CardTitle>{place.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">
                    {PLACE_TYPE_LABELS[place.type]} · {humanizeCity(place.city)}
                  </span>
                  <Link
                    href={`/map?place=${encodeURIComponent(place.id)}`}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open on map
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <Button asChild variant="outline">
          <Link href={mapHref(page.code)}>Explore {page.name} on the map</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
