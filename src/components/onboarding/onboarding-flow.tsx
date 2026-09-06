"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isMissingTableError } from "@/lib/utils";
import {
  ensureProfileRow,
  graduationYearOptions,
  saveProfileStep,
  ONBOARDING_BOARDS,
  ONBOARDING_COUNTRIES,
  ONBOARDING_FIELDS,
  ONBOARDING_REFERRAL_SOURCES,
  type OnboardingBoard,
  type OnboardingCountry,
  type OnboardingField,
  type OnboardingReferralSource,
  type UserProfileRow,
} from "@/lib/user-profile";

interface OnboardingFlowProps {
  /** Where to send the user once they finish or skip the whole thing. */
  next: string;
}

type StepId = "graduation_year" | "board" | "field" | "country" | "referral_source";

const STEPS: StepId[] = ["graduation_year", "board", "field", "country", "referral_source"];

const STEP_COPY: Record<StepId, { title: string; hint?: string }> = {
  graduation_year: { title: "When are you graduating?" },
  board: { title: "What board are you on?" },
  field: { title: "What field are you focused on?" },
  country: {
    title: "Which country are you in?",
    hint: "This sets the default qualifying pathway on competition pages and in the calendar.",
  },
  referral_source: {
    title: "How did you find StudyMap?",
    hint: "Optional, just helps us know what's working.",
  },
};

/** First step whose answer is still unset, so a returning user resumes where they left off. */
function firstUnansweredStep(profile: UserProfileRow): number {
  const index = STEPS.findIndex((step) => profile[step] === null);
  return index === -1 ? STEPS.length - 1 : index;
}

/**
 * The first-run onboarding questionnaire: graduation year, board, field,
 * country, and how the user found StudyMap. See issue #204.
 *
 * Skippable and resumable by design: every answer persists to `user_profiles`
 * as soon as it's given (`saveProfileStep`), a blank row is written the
 * moment this mounts (`ensureProfileRow`) so a full skip still counts as
 * "asked", and nothing here ever blocks navigation away from the flow.
 */
export function OnboardingFlow({ next }: OnboardingFlowProps) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [graduationYear, setGraduationYear] = React.useState<number | null>(null);
  const [board, setBoard] = React.useState<OnboardingBoard | null>(null);
  const [field, setField] = React.useState<OnboardingField | null>(null);
  const [country, setCountry] = React.useState<OnboardingCountry | null>(null);
  const [referralSource, setReferralSource] =
    React.useState<OnboardingReferralSource | null>(null);
  const [referralOther, setReferralOther] = React.useState("");

  const headingRef = React.useRef<HTMLHeadingElement>(null);

  // Mark that the user has been offered onboarding (writes a blank row if
  // none exists yet) and prefill from whatever's already answered, so
  // closing the tab mid-flow and coming back resumes instead of restarting.
  React.useEffect(() => {
    let cancelled = false;
    ensureProfileRow()
      .then((profile) => {
        if (cancelled) return;
        setGraduationYear(profile.graduation_year);
        setBoard(profile.board);
        setField(profile.field);
        setCountry(profile.country);
        setReferralSource(profile.referral_source);
        setReferralOther(profile.referral_other ?? "");
        setStepIndex(firstUnansweredStep(profile));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        // Can't run the questionnaire against a table that doesn't exist
        // (e.g. the #203 migration hasn't been applied to this deployment
        // yet) or without a session. Either way, never block on it: send
        // the user straight through.
        if (isMissingTableError(err)) {
          router.replace(next);
          return;
        }
        setLoading(false);
        setError("Couldn't load your answers. You can still continue.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move focus to the new step's heading whenever it changes, so screen
  // reader and keyboard users land somewhere sensible instead of nowhere.
  React.useEffect(() => {
    if (!loading) headingRef.current?.focus();
  }, [stepIndex, loading]);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function finish() {
    router.push(next);
  }

  async function advance(patch: Record<string, unknown> | null) {
    setSaving(true);
    setError(null);
    try {
      if (patch) await saveProfileStep(patch);
      if (isLastStep) {
        finish();
      } else {
        setStepIndex((i) => i + 1);
      }
    } catch {
      setError("Couldn't save that. You can try again or skip for now.");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    advance(null);
  }

  function handleNext() {
    switch (step) {
      case "graduation_year":
        return advance({ graduation_year: graduationYear });
      case "board":
        return advance({ board });
      case "field":
        return advance({ field });
      case "country":
        return advance({ country });
      case "referral_source":
        return advance({
          referral_source: referralSource,
          referral_other: referralSource === "Other" ? referralOther.trim() || null : null,
        });
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG wordmark, no optimization needed */}
        <img src="/logo-light.svg" alt={site.name} width={140} height={26} className="h-6 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG wordmark, no optimization needed */}
        <img src="/logo-dark.svg" alt={site.name} width={140} height={26} className="hidden h-6 w-auto dark:block" />
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  const copy = STEP_COPY[step];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <Button variant="ghost" size="sm" onClick={handleSkip} disabled={saving}>
          Skip for now
        </Button>
      </div>

      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-2xl font-bold tracking-tight text-foreground outline-none"
        >
          {copy.title}
        </h1>
        {copy.hint && <p className="mt-1 text-sm text-muted-foreground">{copy.hint}</p>}
      </div>

      {step === "graduation_year" && (
        <div className="grid gap-1.5">
          <Label htmlFor="onboarding-graduation-year">Graduation year</Label>
          <Select
            value={graduationYear !== null ? String(graduationYear) : undefined}
            onValueChange={(value) => setGraduationYear(Number(value))}
          >
            <SelectTrigger id="onboarding-graduation-year" className="w-full">
              <SelectValue placeholder="Choose a year" />
            </SelectTrigger>
            <SelectContent>
              {graduationYearOptions().map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {step === "board" && (
        <div className="grid gap-1.5">
          <Label htmlFor="onboarding-board">Board</Label>
          <Select
            value={board ?? undefined}
            onValueChange={(value) => setBoard(value as OnboardingBoard)}
          >
            <SelectTrigger id="onboarding-board" className="w-full">
              <SelectValue placeholder="Choose a board" />
            </SelectTrigger>
            <SelectContent>
              {ONBOARDING_BOARDS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {step === "field" && (
        <div className="grid gap-1.5">
          <Label htmlFor="onboarding-field">Field</Label>
          <Select
            value={field ?? undefined}
            onValueChange={(value) => setField(value as OnboardingField)}
          >
            <SelectTrigger id="onboarding-field" className="w-full">
              <SelectValue placeholder="Choose a field" />
            </SelectTrigger>
            <SelectContent>
              {ONBOARDING_FIELDS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {step === "country" && (
        <div className="grid gap-1.5">
          <Label htmlFor="onboarding-country">Country</Label>
          <Select
            value={country ?? undefined}
            onValueChange={(value) => setCountry(value as OnboardingCountry)}
          >
            <SelectTrigger id="onboarding-country" className="w-full">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              {ONBOARDING_COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {step === "referral_source" && (
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="onboarding-referral-source">How did you find StudyMap?</Label>
            <Select
              value={referralSource ?? undefined}
              onValueChange={(value) => setReferralSource(value as OnboardingReferralSource)}
            >
              <SelectTrigger id="onboarding-referral-source" className="w-full">
                <SelectValue placeholder="Choose one (optional)" />
              </SelectTrigger>
              <SelectContent>
                {ONBOARDING_REFERRAL_SOURCES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {referralSource === "Other" && (
            <div className="grid gap-1.5">
              <Label htmlFor="onboarding-referral-other">Tell us more (optional)</Label>
              <Input
                id="onboarding-referral-other"
                value={referralOther}
                onChange={(e) => setReferralOther(e.target.value)}
                maxLength={200}
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={handleBack} disabled={stepIndex === 0 || saving}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={saving}>
          {isLastStep ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
