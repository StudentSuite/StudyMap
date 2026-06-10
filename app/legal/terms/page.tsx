import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms of use for ${site.name}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="June 2026">
      <p>
        This is a placeholder terms page for a student project. It sets out the
        basics in plain language. The final wording is reviewed before any
        public launch.
      </p>

      <LegalSection heading="Use the data as a starting point">
        <p>
          {site.name} points you toward places, papers, and perks. Details
          change: an exam centre can move, a portal can update its links, a perk
          can end. Confirm anything important with the official source before you
          rely on it. We provide pointers, not guarantees.
        </p>
      </LegalSection>

      <LegalSection heading="Contributions">
        <p>
          Public places are added through GitHub with a proof gate (a source
          citation and a minimum Google Maps rating and review count). By
          contributing you confirm the information is accurate to the best of
          your knowledge and that you have the right to share it.
        </p>
      </LegalSection>

      <LegalSection heading="No hosting of papers">
        <p>
          The site does not host past papers or copyrighted files. It only links
          out to official sources. The local papers folder lives on your own
          machine and is your responsibility.
        </p>
      </LegalSection>

      <LegalSection heading="As is">
        <p>
          The project is offered as is, without warranty. Use your judgement,
          especially around travel, exam logistics, and official paperwork.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
