import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/lib/site";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about StudyMap: data accuracy, reporting wrong info, why a place isn't listed, and accounts.",
};

export default function FaqPage() {
  return (
    <>
      <div className="space-y-4">
          <CalloutCard title="How accurate is the data?">
            <p>
              Every place was added by a contributor through GitHub, with a required
              4.0+ Google Maps rating and 50+ reviews at the time of submission - but
              that proof lives in the pull request, not as an automated check, so it&apos;s
              honor-system rather than machine-verified. Places can also go stale
              (closed, moved, hours changed) after being added. See{" "}
              <Link href="/docs/data-sources" className="font-medium text-primary hover:underline">
                Data Sources &amp; Provenance
              </Link>{" "}
              for the full picture.
            </p>
          </CalloutCard>

          <CalloutCard title="I found wrong or outdated info. How do I report it?">
            <p>
              Open an issue at{" "}
              <a
                href={`${site.repo}/issues`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                github.com/StudentSuite/StudyMap/issues
              </a>{" "}
              describing what changed. No GitHub account handy? Use the{" "}
              <span className="font-medium">Suggest a place</span> button on the{" "}
              <Link href="/map" className="font-medium text-primary hover:underline">
                map
              </Link>{" "}
              instead - it opens a pre-filled issue for you.
            </p>
          </CalloutCard>

          <CalloutCard title="Why isn't my school or a place I know listed?">
            <p>
              Either nobody has submitted it yet, or it didn&apos;t clear the quality
              gate: a 4.0+ Google Maps rating, 50+ reviews, and confirmation it&apos;s
              real and currently operating. Add it yourself via the{" "}
              <span className="font-medium">Suggest a place</span> button on the map, or
              see{" "}
              <Link href="/docs/contributing" className="font-medium text-primary hover:underline">
                Contributing Places
              </Link>{" "}
              to open a pull request directly.
            </p>
          </CalloutCard>

          <CalloutCard title="Do I need an account to use StudyMap?">
            <p>
              No. The map, search, filters, and exam calendar all work fully without
              signing in. An account is only needed for two optional, private features:
              saving your own places and a home location, and adding personal events to
              the calendar - neither of which are visible to anyone else.
            </p>
          </CalloutCard>

          <CalloutCard title="How do I sign in?">
            <p>
              Go to{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>{" "}
              and use either Google or email and password. There&apos;s nothing else to
              configure.
            </p>
          </CalloutCard>

          <CalloutCard title="What's the difference between adding a place and saving one?">
            <p>
              Adding a place (via GitHub PR or issue) puts it on the public map for every
              visitor, after the quality gate above. Saving a place (via the map&apos;s
              &quot;My places&quot; panel, signed in) is private to your account only and
              never appears on anyone else&apos;s map - it&apos;s a personal bookmark, not
              a public contribution.
            </p>
          </CalloutCard>
      </div>
    </>
  );
}
