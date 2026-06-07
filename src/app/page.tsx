import Link from "next/link";
import { BookOpen, FileText, Gift, MapPin } from "lucide-react";

import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    href: "/",
    icon: MapPin,
    title: "Places map",
    description:
      "Exam centres, libraries, book depots, and more across Mumbai, Thane, and Navi Mumbai.",
  },
  {
    href: "/resources",
    icon: BookOpen,
    title: "Past papers",
    description:
      "Curated links to past papers and official portals by board: IB, IGCSE, NEET, JEE, UPSC, SAT.",
  },
  {
    href: "/papers",
    icon: FileText,
    title: "Local papers",
    description:
      "Browse papers you keep in your own papers/ folder, available offline on localhost.",
  },
  {
    href: "/benefits",
    icon: Gift,
    title: "Student benefits",
    description:
      "How to claim student perks, get software free or discounted, travel solo, and apply for a passport.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <section className="flex flex-col items-start gap-4">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3.5 text-primary" />
          Mumbai Metropolitan Region
        </span>
        <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {site.tagline}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{site.description}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">Open the map</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/resources">Find past papers</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Link key={feature.title} href={feature.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <feature.icon className="size-6 text-primary" />
                <CardTitle className="mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
