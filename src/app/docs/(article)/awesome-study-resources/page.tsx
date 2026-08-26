import type { Metadata } from "next";

import { fetchAwesomeList } from "@/lib/awesome-list";
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
    <AwesomeListBrowser
      sections={sections}
      repoName="awesome-study-resources"
      repoUrl="https://github.com/StudentSuite/awesome-study-resources"
    />
  );
}
