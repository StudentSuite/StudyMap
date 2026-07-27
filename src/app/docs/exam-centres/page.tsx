import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { StepCard } from "@/components/docs/step-card";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "Finding Exam Centres",
  description:
    "How to use StudyMap to locate verified SAT centres and foreign language exam centres worldwide.",
};

export default function ExamCentresPage() {
  return (
    <>
      <DocsPageHeader
        title="Finding Exam Centres"
        breadcrumbLabel="Finding Exam Centres"
        description={
          <>
            StudyMap currently lists <strong>SAT centres</strong> and{" "}
            <strong>foreign language exam centres</strong> (Goethe-Zertifikat,
            IELTS, TOEFL, DELF). IB and Cambridge IGCSE centres are not listed
            and there is no current plan to add them.
          </>
        }
      />
      <PageContainer>
        <div className="space-y-0">
          <StepCard step={1} title="Open the map and filter" description="Start at the Map page">
            <p>
              Go to the{" "}
              <Link href="/map" className="font-medium text-primary hover:underline">
                Map
              </Link>{" "}
              page. In the filter panel (left side on desktop, tap the filter icon on
              mobile), select <span className="font-medium">SAT centre</span> for SAT
              venues or <span className="font-medium">Foreign lang exam centre</span>{" "}
              for Goethe, IELTS, TOEFL, and DELF venues.
            </p>
            <p>
              Purple pins are SAT centres. Cyan pins are foreign language exam centres.
              Each pin shows the name, city, and address when tapped.
            </p>
          </StepCard>

          <StepCard step={2} title="Get directions" description="One tap to Google Maps">
            <p>
              Tap any exam centre pin, then tap <span className="font-medium">Directions</span>{" "}
              in the popup. This opens Google Maps pre-set to that location so you can
              navigate from your current position.
            </p>
          </StepCard>

          <StepCard
            step={3}
            title="Check exam dates"
            description="Calendar page has the exam windows"
            isLast
          >
            <p>
              The{" "}
              <Link href="/calendar" className="font-medium text-primary hover:underline">
                Calendar
              </Link>{" "}
              page shows upcoming SAT exam windows and result dates. Use the month
              navigation to check future months.
            </p>
            <p className="text-xs text-muted-foreground">
              Dates are sourced from the College Board and verified as of June 2026.
              Always confirm with your school or test centre before planning travel.
            </p>
          </StepCard>
        </div>

        <CalloutCard
          title="Centre missing or wrong?"
          description="Help keep the data accurate"
          className="mt-4"
        >
          <p>
            If you know of a SAT or foreign language exam centre that is not on
            the map, or an existing entry has moved or closed, please report it.
          </p>
          <p>
            We are also expanding SAT coverage country by country. See the{" "}
            <a
              href="https://github.com/StudentSuite/StudyMap/issues?q=is%3Aissue+is%3Aopen+%22Add+SAT+centres%22"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              open country requests
            </a>{" "}
            to add centres for your country.
          </p>
          <Link
            href="/docs/contributing"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            How to contribute a place
          </Link>
        </CalloutCard>
      </PageContainer>
    </>
  );
}
