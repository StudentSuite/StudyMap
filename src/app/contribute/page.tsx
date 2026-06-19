import type { Metadata } from "next";

import { site } from "@/lib/site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Help improve StudyMap by adding places, fixing data, or suggesting features.",
};

export default function ContributePage() {
  return (
    <PageContainer>
      <h1 className="font-heading text-3xl font-bold tracking-tight">Contribute to StudyMap</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        StudyMap is built by students, for students. Help improve the map, fix bugs, or suggest features.
      </p>

      <div className="mt-8 space-y-6">
        {/* Add a place */}
        <Card>
          <CardHeader>
            <CardTitle>Add a place</CardTitle>
            <CardDescription>Contribute new exam centres, libraries, cafes, or other student-relevant locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-foreground/80">
                Places are added via GitHub pull requests. Here is the process:
              </p>
              <ol className="ml-4 list-inside list-decimal space-y-2 text-sm text-foreground/80">
                <li>Fork the repository on GitHub</li>
                <li>Add your place to the JSON file in the <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/</code> folder</li>
                <li>Include a source (link to Google Maps, official website, or similar)</li>
                <li>Create a pull request with a clear description</li>
                <li>Wait for review and merge</li>
              </ol>
              <p className="text-xs text-muted-foreground">
                All places must have a source citation and meet a minimum verification threshold (e.g., Google Maps listing with reviews).
              </p>
            </div>
            <a
              href={site.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View the repository
            </a>
          </CardContent>
        </Card>

        {/* Report an issue */}
        <Card>
          <CardHeader>
            <CardTitle>Report a bug or suggest a feature</CardTitle>
            <CardDescription>Found incorrect data, a broken link, or have an idea for improvement?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-foreground/80">
                Open an issue on GitHub:
              </p>
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
              <a href="mailto:dhawansanay@gmail.com" className="font-medium text-primary hover:underline">
                dhawansanay@gmail.com
              </a>{" "}
              or open a GitHub discussion.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recognition */}
      <div className="mt-12 rounded-lg bg-muted p-6">
        <h2 className="font-heading text-lg font-semibold">Contributors are awesome</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every contribution (whether adding a place, fixing data, or improving docs) helps other students. Contributors are listed in the GitHub repository. Thank you for building StudyMap with us!
        </p>
      </div>
    </PageContainer>
  );
}
