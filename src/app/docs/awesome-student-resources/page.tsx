import type { Metadata } from "next";

import { fetchAwesomeList } from "@/lib/awesome-list";
import { PageContainer } from "@/components/layout/page-container";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { AwesomeListBrowser } from "@/components/docs/awesome-list-browser";

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
        <AwesomeListBrowser
          sections={sections}
          repoName="awesome-student-resources"
          repoUrl="https://github.com/StudentSuite/awesome-student-resources"
        />
      </PageContainer>
    </>
  );
}
