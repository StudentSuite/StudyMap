"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { humanizeCity, type Place } from "@/lib/types";
import { site } from "@/lib/site";

const ISSUE_TYPES = ["closed", "wrong_address", "wrong_info", "other"] as const;
type IssueType = (typeof ISSUE_TYPES)[number];

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  closed: "This place has closed",
  wrong_address: "Wrong address or location",
  wrong_info: "Wrong information (name, type, exam...)",
  other: "Something else",
};

interface ReportIssueDialogProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildIssueUrl(
  place: Place,
  fields: { issueType: IssueType; details: string; reporter: string },
): string {
  const title = `Report issue: ${place.name}`;
  const body = [
    `**Place:** ${place.name} (\`${place.id}\`)`,
    `**City:** ${humanizeCity(place.city)}`,
    `**Issue:** ${ISSUE_TYPE_LABELS[fields.issueType]}`,
    `**Current Google Maps link:** ${place.gmaps_link}`,
    "",
    "**Details:**",
    fields.details.trim() || "(not provided)",
    ...(fields.reporter.trim()
      ? ["", `**Reported by:** @${fields.reporter.trim().replace(/^@/, "")}`]
      : []),
    "",
    "---",
    `Submitted via the "Report an issue" form on ${site.url}/map.`,
  ].join("\n");

  const params = new URLSearchParams({ title, body });
  return `${site.repo}/issues/new?${params.toString()}`;
}

/**
 * Public, no-account entry point for flagging a problem with an EXISTING
 * place - mirrors `SuggestPlaceDialog`'s "pre-filled GitHub issue, no
 * account needed" pattern, scoped to one place instead of a new suggestion.
 * Skips the Google Maps link field/validation entirely: this dialog reports
 * a problem with a place that's already on the map, it doesn't collect one.
 */
export function ReportIssueDialog({ place, open, onOpenChange }: ReportIssueDialogProps) {
  const [issueType, setIssueType] = React.useState<IssueType>("closed");
  const [details, setDetails] = React.useState("");
  const [reporter, setReporter] = React.useState("");
  const [popupBlocked, setPopupBlocked] = React.useState(false);
  const [lastResetKey, setLastResetKey] = React.useState<string | null>(null);

  // Clear the form each time the dialog opens for a (possibly different)
  // place, during render so there's no stale-data flash.
  const resetKey = open ? (place?.id ?? "none") : null;
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    if (open) {
      setIssueType("closed");
      setDetails("");
      setReporter("");
      setPopupBlocked(false);
    }
  }

  const issueUrl = place ? buildIssueUrl(place, { issueType, details, reporter }) : null;

  function handleSubmit() {
    if (!issueUrl) return;

    // Open a blank tab first so a non-null handle genuinely means the browser
    // allowed the popup. Passing "noopener" to window.open intentionally
    // returns null even when the tab opens. Sever opener before navigating.
    const opened = window.open("", "_blank");
    if (!opened) {
      setPopupBlocked(true);
      toast.error("Pop-up blocked. Your report is still here.");
      return;
    }

    opened.opener = null;
    opened.location.replace(issueUrl);
    setPopupBlocked(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open && place !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {place && (
          <>
            <DialogHeader>
              <DialogTitle>Report an issue</DialogTitle>
              <DialogDescription>
                {place.name} - opens a pre-filled GitHub issue for a maintainer to review, no
                account or Git knowledge needed beyond a GitHub sign-in to submit it.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="report-issue-type">What&apos;s wrong</Label>
                <Select
                  value={issueType}
                  onValueChange={(value) => setIssueType(value as IssueType)}
                >
                  <SelectTrigger id="report-issue-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ISSUE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="report-issue-details">Details</Label>
                <textarea
                  id="report-issue-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  placeholder="What did you find, and when?"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="report-issue-reporter">Your GitHub handle</Label>
                <Input
                  id="report-issue-reporter"
                  value={reporter}
                  onChange={(e) => setReporter(e.target.value)}
                  placeholder="Optional"
                  maxLength={60}
                />
              </div>

              {popupBlocked && issueUrl ? (
                <p role="alert" className="text-sm text-destructive">
                  Pop-up blocked. Your report is still here.{" "}
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    Open GitHub here
                  </a>
                  .
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!issueUrl}>
                Open GitHub issue
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
