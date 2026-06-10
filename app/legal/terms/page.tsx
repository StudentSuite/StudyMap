import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms of use for ${site.name}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="June 2026">
      <p>Keep it simple: contribute real info, don't be abusive, and double-check things yourself.</p>

      <LegalSection heading="It's crowdsourced">
        <p>
          {site.name} is built by students like you. Data might be outdated, incomplete, or wrong. Always verify with official sources before relying on anything important.
        </p>
      </LegalSection>

      <LegalSection heading="Add real places">
        <p>
          Contribute only places you've verified. Include the source (Google Maps link, school website, etc.). All data becomes public domain (CC0)—free for anyone to use.
        </p>
      </LegalSection>

      <LegalSection heading="Be respectful">
        <p>
          No scraping, spam, false info, or harassment. Keep it a welcoming space.
        </p>
      </LegalSection>

      <LegalSection heading="Links to external sites">
        <p>
          We link to external resources (Google Maps, past papers, portals). We're not responsible for their content or if they break. Check their terms.
        </p>
      </LegalSection>

      <LegalSection heading="We're not liable for...">
        <p>
          ...missed exams, wrong directions, closed places, broken links, or any damage from using the site. Use it at your own risk. Verify everything independently.
        </p>
      </LegalSection>

      <LegalSection heading="No endorsement">
        <p>
          Listed places and resources are not endorsed. Research independently before using any service.
        </p>
      </LegalSection>

      <LegalSection heading="This is a student project">
        <p>
          No paid staff. No SLA. We'll try to keep it running, but make no promises.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
