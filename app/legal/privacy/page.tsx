import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${site.name} handles your data.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Your Privacy" updated="June 2026">
      <p>We keep this simple: we collect minimal data and don't track you. Here's what you need to know.</p>

      <LegalSection heading="When you're just browsing">
        <p>
          No personal data collected. You can use the entire map, resources, and guides without signing in. That's it.
        </p>
      </LegalSection>

      <LegalSection heading="When you save private places">
        <p>
          Sign in with your Google email. We store your place names, locations, and notes. Only you can see them (encrypted with row-level security). We keep them as long as your account exists.
        </p>
      </LegalSection>

      <LegalSection heading="Location (Near me button)">
        <p>
          When you tap "Near me," your phone shares your location just to sort places by distance. It stays on your device—we don't see it or store it.
        </p>
      </LegalSection>

      <LegalSection heading="No cookies, no tracking">
        <p>
          We don't track you. We remember your light/dark mode preference in your browser. That's it. No ads, no analytics, no profiling.
        </p>
      </LegalSection>

      <LegalSection heading="Data security">
        <p>
          Private pins are encrypted. Google handles your password (we never see it). Everything travels over HTTPS.
        </p>
      </LegalSection>

      <LegalSection heading="Delete your data anytime">
        <p>
          Delete your account and all your data disappears. No backups, no archives.
        </p>
      </LegalSection>

      <LegalSection heading="Third-party services we use">
        <p>
          <strong>Google:</strong> Handles sign-in. Check their privacy policy if you want details.
        </p>
        <p>
          <strong>Supabase:</strong> Hosts your data. supabase.com/privacy has their policy.
        </p>
        <p>
          <strong>OpenStreetMap:</strong> Provides map tiles. Your browser talks to them.
        </p>
      </LegalSection>

      <LegalSection heading="Questions?">
        <p>
          Email us. We'll respond within a week. You can also review our code—it's all open source, so you can see exactly what we do.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
