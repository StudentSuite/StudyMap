"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Rss } from "lucide-react";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { fetchCalendarToken, rotateCalendarToken } from "@/lib/user-profile";
import { isMissingTableError } from "@/lib/utils";

/**
 * Discoverable feed URL for the saved-competitions calendar subscription
 * (#210): `GET /api/competitions/saved.ics?token=...`. Subscribing once in
 * Google Calendar or Apple Calendar means every saved competition's dates
 * show up automatically, no email, no push permission prompt.
 */
export function CalendarFeedCard() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [confirmingRotate, setConfirmingRotate] = useState(false);

  useEffect(() => {
    fetchCalendarToken()
      .then(setToken)
      .catch((err) => {
        setError(
          isMissingTableError(err)
            ? "This deployment's calendar-feed column isn't set up yet. See SELF-HOSTING.md."
            : "Couldn't load your calendar feed link. Try reloading.",
        );
      });
  }, []);

  const feedUrl = token ? `${site.url}/api/competitions/saved.ics?token=${token}` : null;

  function handleCopy() {
    if (!feedUrl) return;
    navigator.clipboard
      .writeText(feedUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  async function handleRotate() {
    setRotating(true);
    setError(null);
    try {
      const next = await rotateCalendarToken();
      setToken(next);
      setConfirmingRotate(false);
    } catch {
      setError("Couldn't rotate your feed link. Try again.");
    } finally {
      setRotating(false);
    }
  }

  if (error) {
    return (
      <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-2.5">
        <Rss className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">Subscribe from your calendar</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add this link in Google Calendar (Settings &gt; Add calendar &gt; From
            URL) or Apple Calendar (File &gt; New Calendar Subscription) and every
            saved competition&apos;s dates show up there automatically. Estimated
            dates are marked &quot;approximate&quot; in the event title.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={feedUrl ?? "Loading..."}
              aria-label="Calendar feed URL"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs text-foreground"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={!feedUrl}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            This link is a private credential, like a password - anyone with it can
            see your saved competitions. Don&apos;t post it publicly.
          </p>

          <div className="mt-3">
            {confirmingRotate ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  The old link will stop working immediately. Continue?
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmingRotate(false)}
                  disabled={rotating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRotate}
                  disabled={rotating}
                >
                  Rotate link
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmingRotate(true)}
                disabled={!token}
                className="gap-1.5 text-muted-foreground"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Get a new link
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
