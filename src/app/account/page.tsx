import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { AccountView } from "./AccountView";

export const metadata: Metadata = {
  title: "Your Account",
  description:
    "Your signed-in email, saved places, home location, personal calendar events, and sign-out, all in one place.",
};

export default function AccountPage() {
  return (
    <PageContainer width="narrow">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Your Account</h1>
      <p className="mt-2 text-muted-foreground">
        Everything tied to your signed-in account, in one place.
      </p>

      <AccountView />
    </PageContainer>
  );
}
