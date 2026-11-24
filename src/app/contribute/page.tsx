import type { Metadata } from "next";

import { getCities, getPlaces } from "@/lib/places";
import { site } from "@/lib/site";
import { SuggestPlaceButton } from "@/components/contribute/suggest-place-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "Help improve StudyMap by adding places, fixing data, or suggesting features.",
};

export default function ContributePage() {
  return (
    <PageContainer>
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Contribute to StudyMap
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        StudyMap is built by students, for students. Help improve the map, fix bugs, or
        suggest features.
      </p>

      <div className="mt-10 space-y-8">
        {/* Add a place */}
        <Card>
          <CardHeader>
            <CardTitle>Add a place</CardTitle>
            <CardDescription>
              Contribute new exam centres, libraries, cafes, or other student-relevant
              locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-foreground/80">
                Send us the place name, a Google Maps link and its type. No GitHub
                account, no Git, no JSON. We read the coordinates from the link and open a
                pull request for you, and a maintainer checks it before it goes on the
                map.
              </p>
              <p className="text-xs text-muted-foreground">
                Places need a real Google Maps listing with good reviews (4.0 or higher,
                50 or more reviews). Just want to save a place for yourself? Sign in and
                use &quot;My places&quot; on the map instead - those stay private to your
                account and skip this review.
              </p>
            </div>
            <SuggestPlaceButton datasetCities={getCities(getPlaces())} />

            <details className="group rounded-lg border p-3 text-sm text-foreground/80">
              <summary className="cursor-pointer font-medium">
                Prefer Git? Add it yourself with a pull request
              </summary>
              <ol className="mt-3 ml-4 list-inside list-decimal space-y-2">
                <li>Fork the repository on GitHub</li>
                <li>
                  Add your place to the JSON file in the{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/</code>{" "}
                  folder
                </li>
                <li>
                  Include a source (link to Google Maps, official website, or similar)
                </li>
                <li>Create a pull request with a clear description</li>
                <li>Wait for review and merge</li>
              </ol>
              <a
                href={site.repo}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                View the repository
              </a>
            </details>
          </CardContent>
        </Card>

        {/* Report an issue */}
        <Card>
          <CardHeader>
            <CardTitle>Report a bug or suggest a feature</CardTitle>
            <CardDescription>
              Found incorrect data, a broken link, or have an idea for improvement?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-foreground/80">Open an issue on GitHub:</p>
              <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-foreground/80">
                <li>Incorrect place information or broken links</li>
                <li>Missing places or outdated data</li>
                <li>UI bugs or performance issues</li>
                <li>Feature requests (new place types, filters, etc.)</li>
                <li>Content gaps in guides or documentation</li>
              </ul>
            </div>
            <a
              href={`${site.repo}/issues`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Open an issue
            </a>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Questions?</CardTitle>
            <CardDescription>Not sure where to start or have a question?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">
              Email{" "}
              <a
                href="mailto:studentsuite3@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                studentsuite3@gmail.com
              </a>{" "}
              or open a GitHub discussion.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recognition */}
      <div className="mt-16 rounded-lg bg-muted p-6">
        <h2 className="font-heading text-lg font-semibold">Contributors are awesome</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every contribution (whether adding a place, fixing data, or improving docs)
          helps other students. Contributors are listed in the GitHub repository. Thank
          you for building StudyMap with us!
        </p>
      </div>
    </PageContainer>
  );
}
