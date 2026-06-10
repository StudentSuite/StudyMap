import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";

import { getBenefitGuide, getBenefitSlugs } from "@/lib/benefits";
import { mdxComponents } from "@/components/mdx-content";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getBenefitSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getBenefitGuide(slug);
  if (!guide) return { title: "Student Docs" };
  return { title: guide.meta.title, description: guide.meta.summary };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getBenefitGuide(slug);
  if (!guide) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/benefits"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All Student Docs
      </Link>

      <article className="mt-6">
        <MDXRemote source={guide.content} components={mdxComponents} />
      </article>
    </div>
  );
}
