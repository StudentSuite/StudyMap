import type { Metadata } from "next";

import { StepCard } from "@/components/docs/step-card";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "GitHub Student Developer Pack",
  description:
    "Step-by-step guide for students to claim the free GitHub Student Developer Pack: eligibility, application, verification, and what you get.",
};

const SOURCES = [
  {
    label: "GitHub Education: Student Developer Pack",
    url: "https://education.github.com/pack",
  },
  {
    label: "GitHub Docs: Apply to GitHub Education as a student",
    url: "https://docs.github.com/en/education/explore-the-benefits-of-teaching-and-learning-with-github-education/github-education-for-students/apply-to-github-education-as-a-student",
  },
  {
    label: "GitHub Docs: Why was my application not approved?",
    url: "https://docs.github.com/en/education/explore-the-benefits-of-teaching-and-learning-with-github-education/github-education-for-students/why-wasnt-my-application-for-a-github-education-student-discount-approved",
  },
];

export default function StudentPackPage() {
  return (
    <>
      <div className="space-y-0">
          <StepCard step={1} title="Check eligibility" description="You qualify if all of these are true">
            <ul className="ml-4 list-disc space-y-2">
              <li>You are at least 13 years old.</li>
              <li>
                You are currently enrolled in a degree- or diploma-granting course of
                study (school, college, university, or a homeschool equivalent).
              </li>
              <li>
                You have a verifiable school-issued email address, or documents that
                prove your current student status (student ID card, enrolment letter,
                fee receipt with a current date).
              </li>
              <li>You have a personal GitHub account (free tier is fine).</li>
            </ul>
          </StepCard>

          <StepCard
            step={2}
            title="Prepare your proof"
            description="Indian schools rarely issue student emails. Documents work too."
          >
            <ul className="ml-4 list-disc space-y-2">
              <li>
                Best: a school email address (e.g.{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">you@school.edu.in</code>)
                added and verified in your GitHub email settings.
              </li>
              <li>
                Otherwise: photograph your school ID card or a dated enrolment
                document. The name on the document must match your GitHub profile name.
              </li>
              <li>
                GitHub asks you to capture the document with your device camera during
                the application, so keep the physical document handy.
              </li>
            </ul>
          </StepCard>

          <StepCard step={3} title="Apply" description="Takes about 10 minutes">
            <ol className="ml-4 list-decimal space-y-2">
              <li>
                Sign in to GitHub, then go to{" "}
                <a
                  href="https://education.github.com/pack"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  education.github.com/pack
                </a>{" "}
                and click{" "}
                <span className="font-medium">Sign up for Student Developer Pack</span>.
              </li>
              <li>Select your school from the list (add it manually if missing).</li>
              <li>
                Fill in how you plan to use GitHub, then upload/capture your proof of
                enrolment.
              </li>
              <li>
                Enable two-factor authentication and complete your GitHub profile
                (real name and bio) before submitting. Incomplete profiles are a common
                rejection reason.
              </li>
              <li>
                Submit and wait. Most applications process within a few days; peak
                periods can take longer.
              </li>
            </ol>
          </StepCard>

          <StepCard step={4} title="After approval" description="What you actually get" isLast>
            <ul className="ml-4 list-disc space-y-2">
              <li>GitHub Pro features on your personal account while you remain a student.</li>
              <li>GitHub Copilot Pro at no cost.</li>
              <li>
                Partner offers: free domains (Namecheap, Name.com), cloud credits
                (DigitalOcean, Azure for Students, Heroku), JetBrains IDEs, and
                dozens more. Each redeemed from the pack page.
              </li>
              <li>
                Benefits expire when you can no longer verify student status. GitHub
                re-verifies periodically, so keep your proof current.
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Rejected? Most common causes: mismatched names, undated documents,
              missing two-factor authentication. Fix the issue and reapply. No penalty.
            </p>
          </StepCard>
        </div>

        <CalloutCard
          title="Sources"
          description="Official documentation this guide is based on"
          className="mt-4"
        >
          <ul className="space-y-2">
            {SOURCES.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </CalloutCard>
    </>
  );
}
