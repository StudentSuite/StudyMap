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
import { PLACE_TYPE_LABELS, PLACE_TYPES, type PlaceType } from "@/lib/types";
import { site } from "@/lib/site";

interface SuggestPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildIssueUrl(fields: {
  name: string;
  type: PlaceType;
  city: string;
  address: string;
  gmapsLink: string;
  note: string;
}): string {
  const title = `Suggest a place: ${fields.name}`;
  const body = [
    `**Place name:** ${fields.name}`,
    `**Type:** ${PLACE_TYPE_LABELS[fields.type]}`,
    `**City:** ${fields.city}`,
    `**Address:** ${fields.address || "(not provided)"}`,
    `**Google Maps link:** ${fields.gmapsLink}`,
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

/**
 * Public, no-account entry point for suggesting a new place: collects the
 * same fields as the GitHub-issue path in /docs/contributing, then opens a
 * pre-filled "New issue" page. Nothing is written directly to the repo -
 * a maintainer still reviews and merges it through the existing PR flow.
 */
export function SuggestPlaceDialog({ open, onOpenChange }: SuggestPlaceDialogProps) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<PlaceType>("library");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [gmapsLink, setGmapsLink] = React.useState("");
  const [note, setNote] = React.useState("");
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
      setAddress("");
      setGmapsLink("");
      setNote("");
      setPopupBlocked(false);
    }
  }

  const trimmedName = name.trim();
  const trimmedCity = city.trim();
  const trimmedGmapsLink = gmapsLink.trim();
  const isGmapsLinkValid = isGoogleMapsUrl(trimmedGmapsLink);
  const showGmapsError = trimmedGmapsLink.length > 0 && !isGmapsLinkValid;
  const isValid = Boolean(trimmedName && trimmedCity && isGmapsLinkValid);
  const issueUrl = isValid
    ? buildIssueUrl({
        name: trimmedName,
        type,
        city: trimmedCity,
        address: address.trim(),
        gmapsLink: trimmedGmapsLink,
        note,
      })
    : null;

  function handleSubmit() {
    if (!issueUrl) return;

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
    opened.location.replace(issueUrl);
    setPopupBlocked(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggest a place</DialogTitle>
          <DialogDescription>
            Opens a pre-filled GitHub issue for a maintainer to review - no account or Git
            knowledge needed beyond a GitHub sign-in to submit it.
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
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="suggest-place-address">Address</Label>
            <Input
              id="suggest-place-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional, short and human-readable"
              maxLength={200}
            />
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
              <p id="suggest-place-gmaps-error" role="alert" className="text-xs text-destructive">
                Enter a valid Google Maps link.
              </p>
            ) : null}
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

          {popupBlocked && issueUrl ? (
            <p role="alert" className="text-sm text-destructive">
              Pop-up blocked. Your suggestion is still here.{" "}
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
          <Button onClick={handleSubmit} disabled={!isValid}>
            Open GitHub issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
