import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Disclaimer",
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer">
      <LegalSection heading="Information accuracy">
        <p>
          StudyMap is built by students for students. While we try to keep information
          accurate, places may have changed hours, moved, or closed.
        </p>
        <p>
          <strong className="font-semibold text-foreground">
            Always verify details before visiting:
          </strong>{" "}
          call ahead, check Google Maps, or visit the website.
        </p>
      </LegalSection>

      <LegalSection heading="Not responsible for">
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>Places being open or available</li>
          <li>Pricing or service changes</li>
          <li>Safety or quality of venues</li>
          <li>Your experience at any location</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Community contributions">
        <p>
          Places are added by our community. We moderate but cannot check every entry.
          Report issues and we will investigate.
        </p>
      </LegalSection>

      <LegalSection heading="Use at your own risk">
        <p>
          StudyMap is a tool to help you find places. Make your own decisions and stay
          safe.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
