import type { Metadata } from "next";

import { getResources } from "@/lib/resources";
import { ResourcesBrowser } from "@/components/resources/resources-browser";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Curated, cited links to past papers and official portals for IB, IGCSE, and SAT.",
};

export default function ResourcesPage() {
  const resources = getResources();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Past papers and resources
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Curated, cited links to past papers and official portals for IB, IGCSE, and SAT.
        StudyMap links out to the source; it never hosts files.
      </p>
      <div className="mt-8">
        <ResourcesBrowser resources={resources} />
      </div>
    </div>
  );
}
