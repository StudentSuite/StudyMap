import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { safeNext } from "@/lib/safe-next";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Welcome · StudyMap",
  robots: {
    index: false,
  },
};

interface OnboardingPageProps {
  searchParams: Promise<{ next?: string }>;
}

/**
 * First-run questionnaire, shown once after first sign-in (see
 * `src/app/auth/callback/route.ts` and `handleEmailAuth` in
 * `src/app/login/login-form.tsx`, both of which redirect here only when no
 * `user_profiles` row exists yet). Never reachable in self-host / preview
 * mode, since there is no auth to onboard into.
 */
export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext ?? null);

  return (
    <PageContainer width="narrow" className="max-w-lg">
      <OnboardingFlow next={next} />
    </PageContainer>
  );
}
