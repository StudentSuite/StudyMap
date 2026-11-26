import { Clock, Globe, Phone } from "lucide-react";

import type { Place } from "@/lib/types";

/** The link target for a place's website, or null unless it is a well-formed https URL. */
function safeWebsite(value: string | undefined): { href: string; label: string } | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return { href: url.href, label: url.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

/** Only an international-format number is dialled; anything else is shown as plain text. */
function isDialable(value: string): boolean {
  return /^\+[1-9][0-9]{6,14}$/.test(value);
}

interface PlaceContactProps {
  place: Pick<Place, "website" | "phone" | "hours">;
  /** "compact" for the map popup, "detailed" for the drawer, with a label above each row. */
  variant?: "compact" | "detailed";
}

/**
 * A place's optional website, phone and opening hours (#356). Empty ones are
 * left out, and a place with none of them renders nothing at all, exactly as
 * it did before these fields existed.
 */
export function PlaceContact({ place, variant = "compact" }: PlaceContactProps) {
  const website = safeWebsite(place.website);
  const phone = place.phone?.trim() || null;
  const hours = place.hours?.trim() || null;
  if (!website && !phone && !hours) return null;

  const detailed = variant === "detailed";
  const rowClass = detailed ? "space-y-1" : "flex items-start gap-1.5";
  const textClass = detailed ? "text-sm text-foreground" : "text-xs leading-snug";
  const iconClass = "mt-0.5 size-3.5 shrink-0 text-muted-foreground";
  const linkClass =
    "break-all text-foreground underline underline-offset-2 hover:text-primary";

  return (
    <div className={detailed ? "flex flex-col gap-4" : "flex flex-col gap-1"}>
      {website && (
        <div className={rowClass}>
          {detailed ? (
            <p className="text-xs font-medium text-muted-foreground">Website</p>
          ) : (
            <Globe aria-hidden className={iconClass} />
          )}
          <a
            href={website.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${textClass} ${linkClass}`}
          >
            {website.label}
          </a>
        </div>
      )}
      {phone && (
        <div className={rowClass}>
          {detailed ? (
            <p className="text-xs font-medium text-muted-foreground">Phone</p>
          ) : (
            <Phone aria-hidden className={iconClass} />
          )}
          {isDialable(phone) ? (
            <a href={`tel:${phone}`} className={`${textClass} ${linkClass}`}>
              {phone}
            </a>
          ) : (
            <span className={textClass}>{phone}</span>
          )}
        </div>
      )}
      {hours && (
        <div className={rowClass}>
          {detailed ? (
            <p className="text-xs font-medium text-muted-foreground">Opening hours</p>
          ) : (
            <Clock aria-hidden className={iconClass} />
          )}
          <p className={`${textClass} text-muted-foreground`}>{hours}</p>
        </div>
      )}
    </div>
  );
}
