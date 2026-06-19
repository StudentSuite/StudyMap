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
  title: "Finding Exam Centres",
  description:
    "How to use StudyMap to locate SAT, IB, and IGCSE exam centres across the Mumbai Metropolitan Region.",
};

export default function ExamCentresPage() {
  return (
    <PageContainer>
      <Link
        href="/docs"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        Back to docs
      </Link>

      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Finding Exam Centres
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        StudyMap lists exam centres for SAT, IB, and Cambridge IGCSE across
        Mumbai, Thane, and Navi Mumbai. Here is how to use the map effectively.
      </p>

      <div className="mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>1. Open the map and filter</CardTitle>
            <CardDescription>Start at the Map page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p>
              Go to the{" "}
              <Link href="/map" className="font-medium text-primary hover:underline">
                Map
              </Link>{" "}
              page. In the filter panel (left side on desktop, tap the filter icon on
              mobile), check <span className="font-medium">Exam Centres</span> and
              uncheck any categories you do not need.
            </p>
            <p>
              The purple pins are exam centres. Each pin shows the name, city, and
              address when tapped.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Get directions</CardTitle>
            <CardDescription>One tap to Google Maps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p>
              Tap any exam centre pin, then tap <span className="font-medium">Directions</span>{" "}
              in the popup. This opens Google Maps pre-set to that location so you can
              navigate from your current position.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Check exam dates</CardTitle>
            <CardDescription>Calendar page has the exam windows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p>
              The{" "}
              <Link href="/calendar" className="font-medium text-primary hover:underline">
                Calendar
              </Link>{" "}
              page shows upcoming exam windows and result dates for SAT, IB, and IGCSE.
              Use the month navigation to check future months.
            </p>
            <p className="text-xs text-muted-foreground">
              Dates are sourced from the official boards and verified as of June 2026.
              Always confirm with your school or test centre before planning travel.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Centre missing or wrong?</CardTitle>
            <CardDescription>Help keep the data accurate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-foreground/80">
            <p>
              If you know of a centre that is not on the map, or an existing entry has
              moved or closed, please report it.
            </p>
            <Link
              href="/docs/contributing"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              How to contribute a place
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
