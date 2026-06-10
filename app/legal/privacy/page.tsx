import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${site.name} handles your data.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="June 2026">
      <p>
        This is a placeholder privacy notice for a student project. It explains
        the rough shape of how {site.name} treats data. The final wording is
        reviewed before any public launch.
      </p>

      <LegalSection heading="What runs without an account">
        <p>
          The map, the resources catalogue, the local papers browser, and the
          benefits guides all work with no sign in. Public place data is shipped
          inside the repository as plain JSON, so browsing it does not send your
          activity anywhere beyond the map tile provider (OpenStreetMap).
        </p>
      </LegalSection>

      <LegalSection heading="Accounts and private pins">
        <p>
          Signing in is optional and only needed to save private places (home,
          school, coaching, and similar). Authentication is handled by Supabase
          with Google sign in. Private pins are stored against your account with
          row level security, so they are visible only to you and never mixed
          into the public dataset.
        </p>
      </LegalSection>

      <LegalSection heading="Location">
        <p>
          The near me feature asks your browser for your location to sort the
          nearest places. That coordinate stays on your device and is used only
          to compute distances. It is not stored or transmitted.
        </p>
      </LegalSection>

      <LegalSection heading="Self hosting">
        <p>
          {site.name} is open source and self hostable. If you run your own copy,
          you control your own database and keys, and this notice does not bind
          your deployment.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
