import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="June 2026">
      <LegalSection heading="Using StudyMap">
        <p>
          StudyMap is free to use. You can view the map and contribute places without
          signing up.
        </p>
      </LegalSection>

      <LegalSection heading="Your contributions">
        <p>
          When you add a place or resource, it becomes part of the public map. Keep it
          accurate and relevant. We reserve the right to remove:
        </p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>Spam or irrelevant places</li>
          <li>Offensive or harmful content</li>
          <li>Duplicate or incorrect information</li>
        </ul>
      </LegalSection>

      <LegalSection heading="No warranties">
        <p>
          StudyMap is provided as-is. We do not guarantee that all places are open or
          accurate. Always verify before visiting.
        </p>
      </LegalSection>

      <LegalSection heading="Liability">
        <p>
          We are not responsible for injuries, losses, or issues that arise from using
          information on StudyMap.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
