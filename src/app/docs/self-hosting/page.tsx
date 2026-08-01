import type { Metadata } from "next";
import Link from "next/link";

import { StepCard } from "@/components/docs/step-card";
import { CalloutCard } from "@/components/docs/callout-card";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata: Metadata = {
  title: "Self-Hosting Guide",
  description:
    "Run StudyMap for your own city: fork, configure your region and dataset, and deploy. No coding required beyond editing one config file.",
};

const CLONE = `git clone https://github.com/<your-account>/<your-fork>.git
cd <your-fork>
npm install`;

const CONFIG_COPY = `cp studymap.config.example.ts studymap.config.ts`;

const VALIDATE = `npm run validate`;

const ENV_COPY = `cp .env.example .env.local`;

const DEV = `npm run dev`;

const DEPLOY = `npx vercel`;

const UPSTREAM = `git remote add upstream https://github.com/StudentSuite/StudyMap.git
git fetch upstream
git merge upstream/main`;

export default function SelfHostingPage() {
  return (
    <>
      <div className="space-y-0">
          <StepCard step={1} title="Get the code" description="Fork, clone, install">
            <p>
              Click <span className="font-medium">&quot;Use this template&quot;</span> at
              the top of{" "}
              <a
                href="https://github.com/StudentSuite/StudyMap"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                StudentSuite/StudyMap
              </a>{" "}
              to create your own copy, then clone it.
            </p>
            <CodeBlock code={CLONE} lang="bash" />
          </StepCard>

          <StepCard
            step={2}
            title="Set your region and dataset"
            description="One config file for everything region-specific"
          >
            <p>
              Everything region- and data-specific lives in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">studymap.config.ts</code>{" "}
              at the repo root.
            </p>
            <CodeBlock code={CONFIG_COPY} lang="bash" />
            <p>Edit it:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">center</code>:{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">[lat, lng]</code>{" "}
                for the initial map view
              </li>
              <li>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">defaultZoom</code>:
                initial zoom level (11-13 works well for a metro area)
              </li>
              <li>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">bounds</code>: rough
                coordinate box around your region, used for data validation and map fitting
              </li>
              <li>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">cities</code>:
                display order for the city filter (anything in your data but missing here still
                shows, just sorted alphabetically after)
              </li>
              <li>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">places</code>: swap
                the sample imports for your own <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">data/places/*.json</code>{" "}
                files
              </li>
            </ul>
            <p>
              The dataset itself follows the schema on{" "}
              <Link href="/docs/data-format" className="font-medium text-primary hover:underline">
                Place Data Format
              </Link>
              . <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/places.sample/</code>{" "}
              has two minimal example entries if you want to start from a clean skeleton instead of
              the dataset that ships with the template.
            </p>
            <p>Validate as you go:</p>
            <CodeBlock code={VALIDATE} lang="bash" />
          </StepCard>

          <StepCard
            step={3}
            title="Environment variables"
            description="One required, the rest optional"
          >
            <CodeBlock code={ENV_COPY} lang="bash" />
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  NEXT_PUBLIC_MAPTILER_KEY
                </code>{" "}
                is required for the map basemap. Free tier, no credit card, at{" "}
                <a
                  href="https://cloud.maptiler.com/account/keys/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  cloud.maptiler.com
                </a>
                .
              </li>
              <li>
                The Supabase variables are optional. Leave them blank and the map, filters, and
                calendar all work; you just won&apos;t get sign-in or the two private features in
                step 5.
              </li>
            </ul>
          </StepCard>

          <StepCard step={4} title="Run it" description="Confirm your places show up">
            <CodeBlock code={DEV} lang="bash" />
            <p>
              Open{" "}
              <a
                href="http://localhost:3000/map"
                className="font-medium text-primary hover:underline"
              >
                localhost:3000/map
              </a>{" "}
              and confirm your places show up in the right spot.
            </p>
          </StepCard>

          <StepCard
            step={5}
            title="Optional: sign-in, saved places, personal events"
            description="Needs a free Supabase project"
          >
            <p>
              These three features (sign-in, saved custom places, personal calendar events) need a
              Supabase project. Skip this whole step if you only want the public map and calendar.
            </p>
            <ol className="ml-4 list-decimal space-y-1.5">
              <li>
                Create a free project at{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  supabase.com
                </a>
                .
              </li>
              <li>
                Copy its URL and anon key into{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.local</code>{" "}
                (<code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>).
              </li>
              <li>
                In the Supabase SQL editor, run every file in{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">supabase/migrations/</code>,
                in filename order. Each one creates its tables with row-level security already
                scoped to <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">auth.uid()</code>,
                so users can only ever read or write their own rows.
              </li>
              <li>
                Enable whichever auth providers you want (email, Google, etc.) under
                Authentication &gt; Providers.
              </li>
            </ol>
          </StepCard>

          <StepCard
            step={6}
            title="Deploy"
            description="Any standard Next.js host - static export not supported"
            isLast
          >
            <p>Deploy like any standard Next.js app, for example on Vercel:</p>
            <CodeBlock code={DEPLOY} lang="bash" />
            <p>
              or import the repo at{" "}
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                vercel.com/new
              </a>{" "}
              and set the same environment variables from step 3 in the project settings.
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Static export (<code className="rounded bg-muted px-1 py-0.5 font-mono">output: &quot;export&quot;</code>)
                is not supported.
              </span>{" "}
              Sign-in needs a live server: the OAuth callback route exchanges a code for a session
              server-side, and middleware refreshes that session on every request. Both are
              incompatible with a static build. Deploy to a normal server/edge runtime instead -
              that&apos;s the default for Vercel and most other Next.js hosts.
            </p>
          </StepCard>
        </div>

        <CalloutCard
          title="Keeping your fork current"
          description="StudyMap doesn't push updates to forks automatically"
          className="mt-4"
        >
          <p>To pull in upstream fixes, add the original repo as a remote and merge from it:</p>
          <CodeBlock code={UPSTREAM} lang="bash" />
          <p>
            Your <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">studymap.config.ts</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.local</code>, and{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">data/places/*.json</code>{" "}
            are yours - upstream changes to shared code (map, calendar, components) merge in
            without touching them, unless you&apos;ve also edited those files.
          </p>
        </CalloutCard>
    </>
  );
}
