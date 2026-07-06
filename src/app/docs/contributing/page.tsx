import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Contributing Places",
  description:
    "Add a missing location or fix stale data on StudyMap using a GitHub issue or pull request.",
};

export default function ContributingPage() {
  return (
    <PageContainer>
      <Link
        href="/docs"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        Back to docs
      </Link>

      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Contributing Places
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        StudyMap is open-source and community-maintained. Every place in the
        database was added by a student. Here is how to add or fix one.
      </p>

      <div className="mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Option A: GitHub Issue (easiest)</CardTitle>
            <CardDescription>No code needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p>
              Open a{" "}
              <a
                href="https://github.com/StudentSuite/StudyMap/issues/new"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                new GitHub issue
              </a>{" "}
              with:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Place name</li>
              <li>Full address</li>
              <li>Type: SAT centre, foreign language exam centre, library, government office (passport office, RTO, post office), airport, or other place</li>
              <li>City and country (SAT and foreign language centres are listed worldwide; other categories currently focus on the Mumbai region)</li>
              <li>Google Maps link</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              A maintainer will add the place, usually within a few days.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Option B: Pull Request</CardTitle>
            <CardDescription>For those comfortable with JSON and Git</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <ol className="ml-4 list-decimal space-y-2">
              <li>
                Fork the{" "}
                <a
                  href="https://github.com/StudentSuite/StudyMap"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  StudyMap repo
                </a>
                , clone it locally.
              </li>
              <li>
                Open{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  data/places/&lt;type&gt;.json
                </code>{" "}
                for the relevant place type.
              </li>
              <li>
                Append a new object at the end of the array, following the schema below.
              </li>
              <li>Commit and open a pull request against{" "}<code className="rounded bg-muted px-1 py-0.5 font-mono">main</code>.</li>
            </ol>

            <div className="mt-3 rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
              {`{
  "id": "mum-library-07",
  "name": "Place Name",
  "type": "library",
  "city": "mumbai",
  "lat": 19.1234,
  "lng": 72.8765,
  "address": "Street, Area, City PINCODE",
  "gmaps_link": "https://maps.google.com/?q=19.1234,72.8765",
  "added_by": "your-github-username"
}`}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              ID format: a short city-code prefix (<code className="bg-muted px-1 rounded">mum</code>, <code className="bg-muted px-1 rounded">thn</code>, <code className="bg-muted px-1 rounded">nvm</code>, <code className="bg-muted px-1 rounded">blr</code>, and so on), then the type, then the next available number in that file.
              Coordinates come straight from Google Maps, so there is no fixed range: SAT and foreign language centres span the globe.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fixing stale data</CardTitle>
            <CardDescription>Place moved, closed, or details changed</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80 space-y-2">
            <p>
              Use either option above. For issues, just describe what changed. For a PR,
              edit the existing entry in the relevant JSON file and update the field.
            </p>
            <a
              href="https://github.com/StudentSuite/StudyMap/blob/main/data/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              Full contributing guide on GitHub
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adding SAT centres for a new country</CardTitle>
            <CardDescription>Help expand the map beyond India</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p>
              We are adding SAT centres country by country. Several countries
              already have open tracking issues (Germany, France, UK, UAE,
              Australia, and more).
            </p>
            <ol className="ml-4 list-decimal space-y-2">
              <li>
                Check the{" "}
                <a
                  href="https://github.com/StudentSuite/StudyMap/issues?q=is%3Aissue+is%3Aopen+%22Add+SAT+centres%22"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  open country requests
                </a>
                . If your country is listed, comment there or open a PR that
                closes it. If not, open a new issue for it.
              </li>
              <li>
                Add each centre to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  data/places/sat_centre.json
                </code>{" "}
                with <code className="rounded bg-muted px-1 font-mono">type</code>{" "}
                set to <code className="rounded bg-muted px-1 font-mono">sat_centre</code>,
                plus <code className="rounded bg-muted px-1 font-mono">exam: &quot;SAT&quot;</code>{" "}
                and a <code className="rounded bg-muted px-1 font-mono">valid_till</code> date.
              </li>
              <li>
                Use the real city name and coordinates from Google Maps. Centres
                outside India are welcome and expected here.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
