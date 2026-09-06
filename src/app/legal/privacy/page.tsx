import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <LegalSection heading="What we collect">
        <p>StudyMap collects minimal data. We track:</p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>Places you add to the map (name, location, category)</li>
          <li>Your GitHub username (if you contribute)</li>
          <li>Anonymous, aggregate usage analytics (page views, no personal profile)</li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          Contributed places power the public map. Your GitHub username is shown as the
          contributor on entries you add. Usage analytics help us see which features
          students actually use, so we can improve them.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not do">
        <p>
          We do not sell your data, run third-party ad trackers, or require an account to
          browse the map. The dataset is open, so anything you contribute is public by
          design.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can request to see, edit, or delete your data anytime. Email us and we will
          help.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
