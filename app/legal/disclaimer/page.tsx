import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Accuracy and liability notes for ${site.name}.`,
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="June 2026">
      <p>
        This is a placeholder disclaimer for a student project. The final wording
        is reviewed before any public launch.
      </p>

      <LegalSection heading="Accuracy">
        <p>
          {site.name} is community maintained. Pins carry a citation and a
          freshness check when they are added, but places still change over time.
          Always verify an exam centre, office, or timing against its official
          listing before you travel.
        </p>
      </LegalSection>

      <LegalSection heading="Not official advice">
        <p>
          Guidance on benefits, passports, and solo travel is general
          information, not legal or official advice. Rules and fees change.
          Follow the official government or vendor process for anything binding.
        </p>
      </LegalSection>

      <LegalSection heading="Third party links">
        <p>
          The catalogue links to external sites for past papers and portals. We
          do not control those sites and are not responsible for their content,
          accuracy, or availability.
        </p>
      </LegalSection>

      <LegalSection heading="Liability">
        <p>
          Use {site.name} at your own risk. The maintainers are not liable for
          missed exams, wrong directions, outdated perks, or any loss arising
          from use of the site.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
