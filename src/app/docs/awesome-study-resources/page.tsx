import type { Metadata } from "next";

import { fetchAwesomeList } from "@/lib/awesome-list";
import { PageContainer } from "@/components/layout/page-container";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { AwesomeListBrowser } from "@/components/docs/awesome-list-browser";

export const metadata: Metadata = {
  title: "Awesome Study Resources",
  description:
    "Curated exam prep, subject-study, and learning-tool resources, synced from the awesome-study-resources list.",
};

export const revalidate = 86400;

export default async function AwesomeStudyResourcesPage() {
  const sections = await fetchAwesomeList("awesome-study-resources");

  return (
    <>
      <DocsPageHeader
        title="Awesome Study Resources"
        breadcrumbLabel="Awesome Study Resources"
        description="A curated list of the best exam prep, subject-study, and learning-tool resources for students. This page is generated from the awesome-study-resources repo and syncs automatically within 24 hours of any change there."
      />
      <PageContainer>
        <AwesomeListBrowser
          sections={sections}
          repoName="awesome-study-resources"
          repoUrl="https://github.com/StudentSuite/awesome-study-resources"
        />
      </PageContainer>
    </>
  );
}
