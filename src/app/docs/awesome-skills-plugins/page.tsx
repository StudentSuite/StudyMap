import type { Metadata } from "next";

import { fetchAwesomeList } from "@/lib/awesome-list";
import { PageContainer } from "@/components/layout/page-container";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { AwesomeListBrowser } from "@/components/docs/awesome-list-browser";

export const metadata: Metadata = {
  title: "Awesome Skills & Plugins for Students",
  description:
    "Curated AI coding agent skills and plugins built for students, synced from the awesome-skills-plugins-for-students list.",
};

export const revalidate = 86400;

export default async function AwesomeSkillsPluginsPage() {
  const sections = await fetchAwesomeList("awesome-skills-plugins-for-students");

  return (
    <>
      <DocsPageHeader
        title="Awesome Skills & Plugins for Students"
        breadcrumbLabel="Awesome Skills & Plugins"
        description="A curated list of AI coding agent skills & plugins built for students. This page is generated from the awesome-skills-plugins-for-students repo and syncs automatically within 24 hours of any change there."
      />
      <PageContainer>
        <AwesomeListBrowser
          sections={sections}
          repoName="awesome-skills-plugins-for-students"
          repoUrl="https://github.com/StudentSuite/awesome-skills-plugins-for-students"
        />
      </PageContainer>
    </>
  );
}
