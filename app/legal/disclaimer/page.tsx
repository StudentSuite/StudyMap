import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Accuracy and liability notes for ${site.name}.`,
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Before You Use StudyMap" updated="June 2026">
      <p>
        This is a student project with crowdsourced data. Always verify information independently for anything important.
      </p>

      <LegalSection heading="Data changes fast">
        <p>
          Places close, move, and change hours. Coordinates might be approximate. New places are added all the time. The map is never 100% current.
        </p>
        <p>
          <strong>For critical stuff (exams, travel, deadlines):</strong> Call ahead, check official websites, verify hours.
        </p>
      </LegalSection>

      <LegalSection heading="We're not official">
        <p>
          The guides (passports, benefits, software) are just tips from students. Not legal advice, not government guidance. Laws change frequently.
        </p>
        <p>
          For official info: Passport Seva, IRCTC, your school's website, official exam boards.
        </p>
      </LegalSection>

      <LegalSection heading="Location estimates (Near me)">
        <p>
          GPS estimates can be wrong. Use Google Maps for precise navigation.
        </p>
      </LegalSection>

      <LegalSection heading="External links">
        <p>
          We link to external sites. We don't control them and aren't responsible if they break or change.
        </p>
      </LegalSection>

      <LegalSection heading="No guarantees">
        <p>
          Using this site doesn't guarantee exam success, admission, or any outcome. Results depend on many factors beyond what's here.
        </p>
      </LegalSection>

      <LegalSection heading="Student project">
        <p>
          No paid staff. No SLA. We maintain this in our spare time. Updates happen when we can.
        </p>
      </LegalSection>

      <LegalSection heading="Bottom line">
        <p>
          Use StudyMap as a starting point, not the final answer. Verify important things independently. We're not liable if something goes wrong.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
