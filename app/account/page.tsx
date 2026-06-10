import type { Metadata } from "next";

import { AccountPanel } from "@/components/account/account-panel";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to save private places only you can see.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Account</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Save private places like home, school, or coaching. Everything else on StudyMap works without an account.
      </p>
      <div className="mt-8">
        <AccountPanel />
      </div>
    </div>
  );
}
