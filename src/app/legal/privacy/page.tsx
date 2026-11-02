import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Privacy Policy",
};

const CONTACT = "studentsuite3@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 2026">
      <LegalSection heading="Browsing without an account">
        <p>
          You do not need an account to use the map, the city pages or the competitions
          list. Without one, StudyMap does not keep a profile of you. Page views are
          counted by the analytics described below.
        </p>
      </LegalSection>

      <LegalSection heading="What we store if you create an account">
        <p>
          Signing in (with an email and password, or with Google) creates an account.
          Everything below is stored against that account and is private to it:
        </p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>
            Your sign-in details: your email address and the account record that holds
            them.
          </li>
          <li>
            Saved places you add for yourself: name, type, city, coordinates, address and
            a note.
          </li>
          <li>A home location, if you set one: coordinates and a label.</li>
          <li>Calendar events you add: title, date, category and notes.</li>
          <li>
            Competitions you save, and a private calendar feed link (a random token) for
            them.
          </li>
          <li>
            The answers to the first-run questions, if you give them: graduation year,
            school board, field of study, country, and how you heard about StudyMap.
          </li>
        </ul>
        <p>
          These tables are protected so that an account can read, change and delete only
          its own rows. The one number that is public is how many accounts saved each
          competition; it carries no names.
        </p>
      </LegalSection>

      <LegalSection heading="Places you suggest for the public map">
        <p>
          A place you contribute to the public dataset (through a GitHub issue or pull
          request) is public by design: its name, location and category, and your GitHub
          username as the contributor. That is separate from the private saved places
          above.
        </p>
      </LegalSection>

      <LegalSection heading="Your location">
        <p>
          &ldquo;Near me&rdquo; asks your browser for your location when you press it. The
          position is used in your browser to sort places by distance and is not sent to
          StudyMap. If you deny the permission, the rest of the map still works.
        </p>
      </LegalSection>

      <LegalSection heading="Who else sees what">
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Supabase</strong> hosts accounts and the
            stored rows above.
          </li>
          <li>
            <strong className="text-foreground">Google</strong> handles sign-in if you
            choose &ldquo;Continue with Google&rdquo;, and receives the request to sign
            you in.
          </li>
          <li>
            <strong className="text-foreground">Vercel Analytics</strong> and{" "}
            <strong className="text-foreground">Umami</strong> count page views. Umami is
            loaded only on the live site and only when it is configured. Neither is used
            to build a personal profile.
          </li>
          <li>
            <strong className="text-foreground">MapTiler</strong> serves the map tiles.
            Your browser requests them directly, so MapTiler sees your IP address and
            which part of the map you are looking at. Map data is from OpenStreetMap
            contributors.
          </li>
        </ul>
        <p>
          Signing in sets session cookies so you stay signed in. We do not sell your data
          and do not run advertising trackers.
        </p>
      </LegalSection>

      <LegalSection heading="Password resets">
        <p>
          To limit repeated reset emails, we keep a hash of the email address and the time
          of each reset request, never the address itself. This record is not linked to an
          account.
        </p>
      </LegalSection>

      <LegalSection heading="Seeing, changing and deleting your data">
        <p>
          You can edit or delete your saved places, home location, events and saved
          competitions yourself in the app. To delete your account, email{" "}
          <a
            href={`mailto:${CONTACT}`}
            className="font-medium text-primary hover:underline"
          >
            {CONTACT}
          </a>
          . Deleting an account removes its saved places, home location, events, saved
          competitions and profile answers. You can also write to the same address to ask
          what we hold about you.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
