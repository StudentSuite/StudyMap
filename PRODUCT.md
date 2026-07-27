# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students who need to find a real, verified place for something exam- or study-related:
sitting the SAT (or another standardized exam), finding a library or quiet study spot,
or locating a relevant government/civic office (passport, RTO, embassy). Primary origin
is India, with growing international coverage. Secondary: signed-in users who save
private places, set a home location, and track personal exam/calendar events - these
users get a saved-places layer and a personal calendar on top of the public map.

## Product Purpose

An open, crowdsourced map of every place a student needs, in one map instead of
scattered forums, group chats, and browser tabs. Public data lives in the repo as
reviewed JSON (GitHub PR/issue contributions, each gated on a real source, a 4.0+
Google rating, and 50+ reviews); the deployed site adds an optional private layer
(sign-in, saved places, home location, personal calendar) for users who want it.

## Positioning

"Every place a student needs, on one map" is the real, intended identity, not
aspirational copy to be walked back. The dataset already substantiates the "broad"
half of that claim for its largest category: 281 SAT centres span 217 distinct
cities across India, the US, Canada, and Europe already (confirmed 2026-07-27 by
reading `data/places/*.json` directly). The other five categories (library,
gov_offices, airport, foreign_lang_exam_centre, other_places) are real but thin
(1-27 entries each) and are expected to fill in over time, the same way SAT
centres did - this is early-stage data coverage, not a scope mismatch to correct
in copy. Do not narrow homepage/marketing copy to "SAT-centre-first"; that was
considered and explicitly rejected in favor of keeping the broad framing.

Mechanism a neighboring map product couldn't truthfully copy: every place is
sourced and reviewed in the open (real PR history, real citation requirements),
not scraped or unverified crowdsourced data.

## Operating Context

- Public map: no login required, no setup, works from a static JSON dataset
  bundled at build time (`studymap.config.ts` imports `data/places/*.json`).
- Contribution flow: GitHub PR or issue only, quality-gated (source, 4.0+ rating,
  50+ reviews, dated verification), reviewed by the maintainer before merge. No
  in-app "suggest a place" form exists yet.
- Private layer (optional, requires Supabase): sign-in (email/password or Google),
  saved places, home location, personal calendar events. Self-hosted forks can
  skip this entirely and leave Supabase env vars blank.
- PWA: installable, service-worker-cached (app shell + map tiles) for exam-day use
  on weak/absent signal.
- Self-hostable: forking + retargeting the dataset/region is documented in
  `SELF-HOSTING.md` and centered on one config file (`studymap.config.ts`).

## Capabilities and Constraints

- Six place types: `library`, `other_places`, `airport`, `sat_centre`,
  `foreign_lang_exam_centre`, `gov_offices`. City is a free-form lowercase-slug
  string, not a fixed enum - any city worldwide is accepted, not just India.
- Known data-quality gap (tracked as a separate issue, not fixed in this pass):
  ~225 of 281 SAT-centre entries carry raw ALL-CAPS city values from a bulk
  import instead of the documented lowercase-slug format, which makes the map's
  city filter dropdown look inconsistent. Coordinates and the live "Directions"
  link (computed from `lat`/`lng`, not the stored `gmaps_link` field) are correct;
  the stored `gmaps_link` field itself is unused anywhere in the app.
- Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/
  radix-ui/base-ui, Leaflet + react-leaflet + Supercluster for the map,
  Supabase (`@supabase/ssr`) for optional auth/private data, Vitest for unit
  tests.
- Map basemap requires a MapTiler API key (`NEXT_PUBLIC_MAPTILER_KEY`) - this is
  the one truly required env var; Supabase is optional.
- No framer-motion currently in this codebase (motion is CSS transitions +
  `tw-animate-css` + a hand-rolled canvas particle field for the hero).

## Brand Commitments

- Name: StudyMap. Sibling product under the StudentSuite umbrella
  (`thestudentsuite.com`), sharing font stack (Inter / Space Grotesk / JetBrains
  Mono) and a "graph-paper" notebook grid motif with that site - both codebases
  explicitly comment this as "shared StudentSuite design language." This is a
  family resemblance, not a merged identity: StudyMap keeps its own independent
  amber brand (`#B45309` light / `#F59E0B` dark), which is also reused by the
  `gov_offices` map marker color, so it isn't free to change without touching
  marker semantics too.
- Marker palette (6 colors) is explicitly verified against deuteranopia,
  protanopia, and tritanopia - a real, documented accessibility commitment, not
  just an aesthetic choice.
- House rule: no em dashes in any copy (applies repo-wide, including docs and UI
  strings; existing docs use spaced hyphens instead).

## Evidence on Hand

- Live dataset as of 2026-07-27: 328 places total - 281 SAT centres (217
  distinct cities), 27 libraries, 14 government offices, 3 airports, 2 foreign
  language exam centres, 1 other place. All real, sourced entries per the
  contribution quality gate; no fabricated places or reviews exist anywhere in
  the dataset, and none should be invented for marketing or design purposes.
- `CHANGELOG.md` is actively maintained (Keep a Changelog format) and is the
  source of truth for what shipped when.

## Product Principles

1. Broad vision, honest about current data density - "every place a student
   needs" is the real destination; thin categories are a growth target, not a
   copy problem to paper over or narrow away from.
2. Open data over black box - every place sourced, reviewed, and verifiable;
   nothing scraped or unverifiable.
3. Zero-friction public map - no login, no setup, works from static data; the
   private layer (auth, saved places, calendar) is additive, never a gate.
4. Family resemblance with sibling StudentSuite products (shared type system,
   shared motifs, comparable motion language) without merging brand identity or
   losing StudyMap's own accessibility-driven marker/color decisions.

## Accessibility & Inclusion

WCAG AA minimum across the board (light-mode primary contrast 5.02:1 on white);
dark mode exceeds this at AAA (9.35:1). The 6-color marker palette is verified
against the three common forms of color blindness, a deliberate, documented
commitment given the product's core interaction is distinguishing place types by
color on a map.
