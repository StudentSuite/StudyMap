import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { TrafficExplorer } from "@/components/traffic/traffic-explorer";
import { TrafficStats } from "@/components/traffic/traffic-stats";
import { formatMonth, trafficMonths } from "@/lib/traffic";

export const metadata: Metadata = {
  title: "Traffic",
  description: "Monthly visitors and page views for StudyMap.",
};

export default function TrafficPage() {
  const first = trafficMonths[0];

  return (
    <PageContainer>
      <p className="kicker">Traffic</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        Monthly traffic
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Visitors and page views for each calendar month
        {first ? `, starting ${formatMonth(first.month, "long")}` : ""}.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        <TrafficStats months={trafficMonths} />
        <TrafficExplorer months={trafficMonths} />
      </div>
    </PageContainer>
  );
}
