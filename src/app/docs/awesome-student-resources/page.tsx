import type { Metadata } from "next";

import { fetchAwesomeList } from "@/lib/awesome-list";
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
    <AwesomeListBrowser
      sections={sections}
      repoName="awesome-student-resources"
      repoUrl="https://github.com/StudentSuite/awesome-student-resources"
    />
  );
}
