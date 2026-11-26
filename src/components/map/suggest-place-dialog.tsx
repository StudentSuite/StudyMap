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
import {
  humanizeCity,
  PLACE_TYPE_LABELS,
  PLACE_TYPES,
  type PlaceType,
  type City,
} from "@/lib/types";
import { site } from "@/lib/site";
import { isE164Phone, isHttpsUrl } from "../../../scripts/lib/data-validation.mjs";
import { normalizePhone } from "../../../scripts/lib/place-submission.mjs";

interface SuggestPlaceDialogProps {
  /** Cities already in the public dataset, offered as suggestions. */
  datasetCities: City[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildIssueUrl(fields: {
  name: string;
  type: PlaceType;
  city: string;
  gmapsLink: string;
  website: string;
  phone: string;
  hours: string;
  contributor: string;
  note: string;
}): string {
  const title = `Suggest a place: ${fields.name}`;
  const body = [
    `**Place name:** ${fields.name}`,
    `**Type:** ${PLACE_TYPE_LABELS[fields.type]}`,
    `**City:** ${fields.city}`,
    `**Google Maps link:** ${fields.gmapsLink}`,
    ...(fields.website ? [`**Website:** ${fields.website}`] : []),
    ...(fields.phone ? [`**Phone:** ${fields.phone}`] : []),
    ...(fields.hours ? [`**Hours:** ${fields.hours}`] : []),
    ...(fields.contributor.trim()
      ? [`**Contributor:** ${fields.contributor.trim()}`]
      : []),
    ...(fields.note.trim() ? ["", "**Additional notes:**", fields.note.trim()] : []),
    "",
    "---",
    `Submitted via the "Suggest a place" form on ${site.url}/map.`,
  ].join("\n");

  const params = new URLSearchParams({ title, body });
  return `${site.repo}/issues/new?${params.toString()}`;
}

export function isGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;

    if (url.hostname === "maps.google.com") return true;
    if (url.hostname === "maps.app.goo.gl") return url.pathname.length > 1;
    if (url.hostname === "www.google.com") {
      return url.pathname === "/maps" || url.pathname.startsWith("/maps/");
    }
    if (url.hostname === "goo.gl") {
      return url.pathname === "/maps" || url.pathname.startsWith("/maps/");
    }

    return false;
  } catch {
    return false;
  }
}

type Phase = "form" | "sending" | "done" | "fallback";

/**
 * Public, no-account entry point for suggesting a new place. Posts the form
 * to /api/submit-place, which files a labelled issue that a workflow turns
 * into a pull request (#264); a maintainer still reviews every one.
 *
 * When the server cannot take the submission (no token configured, GitHub
 * down, offline) the dialog falls back to opening a pre-filled GitHub issue,
 * which needs a GitHub sign-in but works with no server setup.
 */
export function SuggestPlaceDialog({
  datasetCities,
  open,
  onOpenChange,
}: SuggestPlaceDialogProps) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<PlaceType>("library");
  const [city, setCity] = React.useState("");
  const [gmapsLink, setGmapsLink] = React.useState("");
  const [placeWebsite, setPlaceWebsite] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [hours, setHours] = React.useState("");
  const [contributor, setContributor] = React.useState("");
  const [note, setNote] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>("form");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [issueUrl, setIssueUrl] = React.useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = React.useState(false);
  const [lastResetKey, setLastResetKey] = React.useState<boolean | null>(null);

  // Clear the form each time the dialog opens, during render (not an
  // effect) so there's no stale-data flash from a previous suggestion.
  if (open !== lastResetKey) {
    setLastResetKey(open);
    if (open) {
      setName("");
      setType("library");
      setCity("");
      setGmapsLink("");
      setPlaceWebsite("");
      setPhone("");
      setHours("");
      setContributor("");
      setNote("");
      setHoneypot("");
      setPhase("form");
      setFormError(null);
      setIssueUrl(null);
      setPopupBlocked(false);
    }
  }

  const trimmedName = name.trim();
  const trimmedCity = city.trim();
  const trimmedGmapsLink = gmapsLink.trim();
  const isGmapsLinkValid = isGoogleMapsUrl(trimmedGmapsLink);
  const showGmapsError = trimmedGmapsLink.length > 0 && !isGmapsLinkValid;
  // The three contact fields are optional: blank is fine, a filled one must be well formed.
  const trimmedWebsite = placeWebsite.trim();
  const normalizedPhone = normalizePhone(phone);
  const trimmedHours = hours.trim();
  const showWebsiteError =
    trimmedWebsite.length > 0 &&
    (!isHttpsUrl(trimmedWebsite) || /\s/.test(trimmedWebsite));
  const showPhoneError = normalizedPhone.length > 0 && !isE164Phone(normalizedPhone);
  const isValid = Boolean(
    trimmedName &&
    trimmedCity &&
    isGmapsLinkValid &&
    !showWebsiteError &&
    !showPhoneError,
  );
  const fallbackUrl = isValid
    ? buildIssueUrl({
        name: trimmedName,
        type,
        city: trimmedCity,
        gmapsLink: trimmedGmapsLink,
        website: trimmedWebsite,
        phone: normalizedPhone,
        hours: trimmedHours,
        contributor,
        note,
      })
    : null;

  async function handleSubmit() {
    if (!isValid || phase === "sending") return;
    setPhase("sending");
    setFormError(null);

    try {
      const res = await fetch("/api/submit-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          type,
          city: trimmedCity,
          gmapsLink: trimmedGmapsLink,
          // `website` below is the hidden honeypot; the real one is `placeWebsite`.
          placeWebsite: trimmedWebsite,
          phone: normalizedPhone,
          hours: trimmedHours,
          contributor: contributor.trim(),
          note: note.trim(),
          website: honeypot,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reason?: string;
        error?: string;
        issueUrl?: string;
      };

      if (res.ok && json.ok) {
        setIssueUrl(typeof json.issueUrl === "string" ? json.issueUrl : null);
        setPhase("done");
        return;
      }
      if (json.reason === "rate_limited") {
        setFormError("Too many suggestions from this connection. Try again in an hour.");
      } else if (json.reason === "full") {
        setFormError(
          "The review queue is full right now. Please try again in a few days.",
        );
      } else if (json.reason === "invalid") {
        setFormError(json.error ?? "Check the form and try again.");
      } else {
        // "unavailable", "github", or anything unexpected: use the GitHub path.
        setPhase("fallback");
        return;
      }
      setPhase("form");
    } catch {
      // Offline or the route is unreachable.
      setPhase("fallback");
    }
  }

  function handleOpenGithub() {
    if (!fallbackUrl) return;

    // Open a blank tab first so a non-null handle genuinely means the browser
    // allowed the popup. Passing "noopener" to window.open intentionally
    // returns null even when the tab opens. Sever opener before navigating.
    const opened = window.open("", "_blank");
    if (!opened) {
      setPopupBlocked(true);
      toast.error("Pop-up blocked. Your suggestion is still here.");
      return;
    }

    opened.opener = null;
    opened.location.replace(fallbackUrl);
    setPopupBlocked(false);
    onOpenChange(false);
  }

  if (phase === "done") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thanks, it&apos;s in the queue</DialogTitle>
            <DialogDescription>
              A maintainer will check {trimmedName} before it goes on the map. That
              usually takes a few days.
              {issueUrl ? (
                <>
                  {" "}
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    Follow it on GitHub
                  </a>
                  .
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const isFallback = phase === "fallback";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggest a place</DialogTitle>
          <DialogDescription>
            No GitHub account needed. A maintainer checks every place before it goes on
            the map.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-name">Place name</Label>
            <Input
              id="suggest-place-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. City Library, Dadar branch"
              maxLength={120}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as PlaceType)}>
              <SelectTrigger id="suggest-place-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PLACE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-city">City</Label>
            <Input
              id="suggest-place-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai"
              maxLength={60}
              list="suggest-place-city-options"
            />
            <datalist id="suggest-place-city-options">
              {datasetCities.map((c) => (
                <option key={c} value={humanizeCity(c)} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-gmaps">Google Maps link</Label>
            <Input
              id="suggest-place-gmaps"
              value={gmapsLink}
              onChange={(e) => setGmapsLink(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              aria-invalid={showGmapsError}
              aria-describedby={showGmapsError ? "suggest-place-gmaps-error" : undefined}
            />
            {showGmapsError ? (
              <p
                id="suggest-place-gmaps-error"
                role="alert"
                className="text-xs text-destructive"
              >
                Enter a valid Google Maps link.
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-site">Place website (optional)</Label>
            <Input
              id="suggest-place-site"
              type="url"
              inputMode="url"
              value={placeWebsite}
              onChange={(e) => setPlaceWebsite(e.target.value)}
              placeholder="https://..."
              maxLength={300}
              aria-invalid={showWebsiteError}
              aria-describedby={showWebsiteError ? "suggest-place-site-error" : undefined}
            />
            {showWebsiteError ? (
              <p
                id="suggest-place-site-error"
                role="alert"
                className="text-xs text-destructive"
              >
                Enter the website as an https:// link, or leave it blank.
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-phone">Phone (optional)</Label>
            <Input
              id="suggest-place-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 20 7412 7000"
              maxLength={30}
              aria-invalid={showPhoneError}
              aria-describedby={showPhoneError ? "suggest-place-phone-error" : undefined}
            />
            {showPhoneError ? (
              <p
                id="suggest-place-phone-error"
                role="alert"
                className="text-xs text-destructive"
              >
                Include the country code, like +44 20 7412 7000, or leave it blank.
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-hours">Opening hours (optional)</Label>
            <Input
              id="suggest-place-hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Mon-Fri 09:00-17:00"
              maxLength={120}
              aria-describedby="suggest-place-contact-hint"
            />
            <p id="suggest-place-contact-hint" className="text-xs text-muted-foreground">
              Only details from the website or listing of the place itself, please.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-contributor">Your name</Label>
            <Input
              id="suggest-place-contributor"
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
              placeholder="Optional, credited on the place"
              maxLength={60}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-note">Anything else?</Label>
            <textarea
              id="suggest-place-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              placeholder="Optional - why it belongs on the map, rating, review count..."
            />
          </div>

          {/* Honeypot: invisible to people, tempting to bots. */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label htmlFor="suggest-place-website">Website</label>
            <input
              id="suggest-place-website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          {isFallback ? (
            <p role="status" className="text-sm text-muted-foreground">
              We could not send this from here. You can still suggest it through GitHub,
              which needs a GitHub sign-in.
            </p>
          ) : null}

          {popupBlocked && fallbackUrl ? (
            <p role="alert" className="text-sm text-destructive">
              Pop-up blocked. Your suggestion is still here.{" "}
              <a
                href={fallbackUrl}
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
          {isFallback ? (
            <Button onClick={handleOpenGithub} disabled={!isValid}>
              Open GitHub issue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isValid || phase === "sending"}>
              {phase === "sending" ? "Sending..." : "Submit place"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
