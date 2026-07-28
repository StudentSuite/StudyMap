import type { Metadata } from "next";

import { fetchAwesomeList } from "@/lib/awesome-list";
import { PageContainer } from "@/components/layout/page-container";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { CalloutCard } from "@/components/docs/callout-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Awesome Student Resources",
  description:
    "Curated software, tools, textbooks, and channels for students, synced from the awesome-student-resources list.",
};

export const revalidate = 86400;

export default async function AwesomeStudentResourcesPage() {
  const sections = await fetchAwesomeList("awesome-student-resources");

  return (
    <>
      <DocsPageHeader
        title="Awesome Student Resources"
        breadcrumbLabel="Awesome Student Resources"
        description="A curated list of the best software, tools, textbooks, channels, and resources for students. This page is generated from the awesome-student-resources repo and syncs automatically within 24 hours of any change there."
      />
      <PageContainer>
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {section.entries.map((entry) => (
                    <li key={entry.url}>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {entry.name}
                      </a>{" "}
                      - {entry.description}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <CalloutCard
          title="Want to add a resource?"
          description="This list lives in its own repo, not here"
          className="mt-4"
        >
          <p>
            Suggestions and corrections go on the source repo, not StudyMap. Open a pull
            request there and this page picks it up automatically, no StudyMap deploy needed.
          </p>
          <a
            href="https://github.com/StudentSuite/awesome-student-resources"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            awesome-student-resources on GitHub
          </a>
        </CalloutCard>
      </PageContainer>
    </>
  );
}
