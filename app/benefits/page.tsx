import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getBenefitGuides } from "@/lib/benefits";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Student Docs",
  description:
    "Guides for students: software discounts, travel, passports, textbooks, and subject selection.",
};

export default function BenefitsPage() {
  const guides = getBenefitGuides();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Student Docs
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
          Practical guides for students: software tools, travel, passports, recommended
          textbooks, and choosing your IGCSE or IB subjects.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link key={guide.slug} href={`/benefits/${guide.slug}`} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  {guide.meta.title}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardTitle>
                <CardDescription>{guide.meta.summary}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
