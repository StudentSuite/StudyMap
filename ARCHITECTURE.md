# Architecture

StudyMap is a Next.js 16 (App Router) app. The public map, calendar, and place data need no
database and no auth - all place data ships as JSON, imported via `studymap.config.ts` at the
repo root. Signing in (Supabase Auth) is optional and only gates two private features: saved
custom places and personal calendar events, both backed by RLS-scoped Supabase tables under
`supabase/migrations/`. This document is a map for new contributors.

---

## Folder layout

```
studymap/
├── .github/
│   ├── DISCUSSION_TEMPLATE/
│   │   └── request-a-city.yml    # discussion template: request coverage for a new city
│   ├── ISSUE_TEMPLATE/
│   │   ├── add-place.yml         # issue form: suggest a new place
│   │   ├── bug_report.yml        # issue form: file a bug
│   │   ├── feature_request.yml   # issue form: request a feature
│   │   └── config.yml            # disables blank issues, adds contact links
│   ├── workflows/                # CI: lint+typecheck, build+validate-data
│   └── pull_request_template.md
├── data/
│   ├── CONTRIBUTING.md           # data-specific contribution rules
│   ├── places/                   # 9 JSON files, one per place type
│   └── places.sample/            # minimal placeholder dataset for forks (see SELF-HOSTING.md)
├── public/
│   ├── brand/                    # OG image (og.svg, og-preview.html)
│   ├── icons/                    # PWA icons: 192px + 512px, normal + maskable
│   ├── logo-dark.svg
│   ├── logo-light.svg
│   ├── logo-mark.svg
│   ├── favicon.svg
│   ├── manifest.webmanifest      # PWA manifest
│   └── sw.js                     # service worker (offline support)
├── src/
│   ├── app/                      # Next.js App Router pages and layouts
│   ├── components/               # React components, grouped by feature
│   └── lib/                      # pure TypeScript utilities (no JSX)
├── supabase/
│   └── migrations/                # SQL for the two optional, sign-in-gated tables (user_places,
│                                   #   user_home, user_events), run once by hand - see SELF-HOSTING.md
├── ARCHITECTURE.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── CONTRIBUTORS.md
├── LICENSE
├── README.md
├── SECURITY.md
├── SELF-HOSTING.md
├── components.json               # shadcn/ui component config
├── eslint.config.mjs
├── next.config.js
├── package.json
├── postcss.config.mjs
├── studymap.config.ts             # region + dataset config; the file a fork edits to retarget StudyMap
├── studymap.config.example.ts     # starter version of the above, pointing at data/places.sample/
├── tsconfig.json
└── vitest.config.ts
```

### `data/places/`

Nine JSON files, one per place category (imported by `studymap.config.ts` at the repo root, not
directly by `src/lib/places.ts` - see [Data flow](#data-flow) below). Each file is a flat array of
place objects. This is the only place place data lives — nothing is duplicated elsewhere.

| File | Type key |
|------|----------|
| `airport.json` | `airport` |
| `train_station.json` | `train_station` |
| `exam_centre.json` | `exam_centre` |
| `library.json` | `library` |
| `book_shop.json` | `book_shop` |
| `stationery.json` | `stationery` |
| `internet_cafe.json` | `internet_cafe` |
| `imp_locations.json` | `imp_locations` |
| `repair_shop.json` | `repair_shop` |

Record shape (defined in `src/lib/types.ts`):

```ts
{
  id: string;        // kebab-case, unique across all types
  name: string;
  type: PlaceType;
  city: string;       // free-form slug, e.g. "mumbai", "navi_mumbai" - any city worldwide
  lat: number;
  lng: number;
  address?: string;
  gmaps_link: string;
  added_by: string;  // GitHub username
}
```

### `src/app/`

Next.js App Router. Each folder is a route segment.

| Route | File | Purpose |
|-------|------|---------|
| `/` | `page.tsx` | Homepage: hero, feature grid, CTA |
| `/map` | `map/page.tsx` | Full interactive map |
| `/calendar` | `calendar/page.tsx` | Exam calendar (SAT, IB, IGCSE) |
| `/docs` | `docs/page.tsx` | Docs index linking to guides |
| `/docs/contributing` | | How to add a place via PR |
| `/docs/exam-centres` | | How to use the map for exam centres |
| `/docs/github-student-pack` | | GitHub Student Pack guide |
| `/contribute` | `contribute/page.tsx` | Contribution hub (add place / bug / question) |
| `/about` | `about/page.tsx` | Principles, stats, maintainers |
| `/legal/*` | | Privacy, terms, disclaimer |
| `/offline` | `offline/page.tsx` | PWA offline fallback |
| `/login` | `login/page.tsx` | Optional sign-in (Google OAuth, email) |
| `/auth/callback` | `auth/callback/route.ts` | OAuth code exchange (dynamic, not static-export-safe) |

`layout.tsx` (root) wraps every page with `Navbar`, `Footer`, and the theme provider.

### `src/components/`

Components are grouped by feature, not by type.

```
components/
├── home/
│   ├── hero.tsx            # landing hero with particle field
│   ├── hero-particles.tsx  # canvas particle animation
│   └── map-preview.tsx     # static map thumbnail on homepage
├── map/
│   ├── places-map.tsx        # top-level map container: filtering, URL state, geolocation,
│   │                         #   auth + saved-places/home state, merges the private pin layer
│   ├── map-view.tsx          # Leaflet map (clustering, tiles, scroll guard, user dot)
│   ├── map-panel.tsx         # search, category chips, city select, results list, my-places slot
│   ├── my-places-panel.tsx   # signed-in-only saved-places section: own search/city filter, CRUD
│   ├── user-place-dialog.tsx # add/edit/delete a saved place
│   ├── user-home-dialog.tsx  # set/edit/remove the saved home location
│   ├── category-chips.tsx    # type filter chips with counts
│   ├── results-list.tsx      # scrollable place list, optionally distance-sorted
│   ├── map-sheet.tsx         # mobile bottom sheet (vaul) wrapping MapPanel
│   ├── near-me-button.tsx    # desktop geolocation trigger
│   ├── near-me-fab.tsx       # mobile floating geolocation trigger
│   ├── map-error-boundary.tsx
│   └── filters.ts            # `PlaceFilters` type
├── calendar/
│   └── personal-event-dialog.tsx  # add/edit/delete a signed-in user's calendar event
├── pins/
│   └── pin-popup.tsx       # popup on marker click (directions, share, added_by)
├── layout/
│   ├── navbar.tsx          # nav links + sign-in/sign-out
│   ├── footer.tsx
│   ├── page-container.tsx  # max-width wrapper used by most pages
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── legal/
│   └── legal-page.tsx      # shared shell for privacy/terms/disclaimer pages
├── ui/                     # shadcn/ui primitives (Badge, Button, Card, Checkbox,
│                           #   Dialog, DropdownMenu, Input, Label, Particles,
│                           #   Select, Separator, Sheet, Sonner, Switch, Table, Tabs)
├── analytics.tsx           # Umami analytics script (privacy-friendly, cookieless)
├── mdx-content.tsx         # MDX renderer used by docs pages
└── pwa-register.tsx        # service worker registration for offline / PWA support
```

`src/app/calendar/CalendarView.tsx` (a page-level component, not under `components/`) renders the
public exam calendar and, when signed in, the personal-events overlay.

### `src/lib/`

Pure TypeScript modules. No JSX, no React imports. Each file has a single responsibility.

| File | What it does |
|------|-------------|
| `types.ts` | `Place`, `PlaceType`, `City` types; label maps |
| `places.ts` | Reads places from `studymap.config.ts`; exports `getPlaces()` and `filterPlaces()` |
| `geo.ts` | Haversine distance, `placesByDistance()`, `formatDistance()` |
| `map.ts` | `PLACE_TYPE_COLORS` (color-blind-safe palette); `directionsUrl()` |
| `share.ts` | URL state encode/decode for shareable filtered map links |
| `site.ts` | Site name, tagline, repo URL, nav link list |
| `exam-dates.ts` | `EXAM_EVENTS` array with SAT/IB/IGCSE session data |
| `fonts.ts` | next/font setup (Inter, Space Grotesk, JetBrains Mono) |
| `utils.ts` | `cn()` — clsx + tailwind-merge helper; `isMissingTableError()` — detects an unrun Supabase migration |
| `user-places.ts` | CRUD for saved places + home location (`user_places`, `user_home` tables) |
| `user-events.ts` | CRUD for personal calendar events (`user_events` table) |
| `supabase/client.ts`, `supabase/server.ts` | Browser and server Supabase clients (`@supabase/ssr`) |

`types.ts`, `places.ts`, `geo.ts`, `map.ts`, `share.ts`, `exam-dates.ts` have no Supabase dependency
and no side effects, they're the easiest targets for new unit tests (see `*.test.ts` next to
`geo.ts`, `share.ts`, and `places.ts`, run via `npm run test:unit`).

---

## Data flow

```
studymap.config.ts         imports data/places/*.json, exports the merged Place[]
       │
       ▼
src/lib/places.ts          getPlaces() reads the config's Place[]
       │                   filterPlaces() narrows by type and/or city
       ▼
src/components/map/places-map.tsx
       │  reads URL params via share.ts → parseMapState()
       │  calls filterPlaces() on every filter change
       │  if signed in: fetches saved places/home (user-places.ts) and merges
       │  them into the Place[] passed down, on top of the public filters
       │
       ├──▶ src/components/map/map-panel.tsx      (search, chips, city select, my-places-panel)
       ├──▶ src/components/map/near-me-button.tsx  (geolocation → placesByDistance())
       │
       ▼
src/components/map/map-view.tsx
       │  clusters overlapping pins (Supercluster), coloured by PLACE_TYPE_COLORS
       │  on marker click: opens PinPopup
       │
       ▼
src/components/pins/pin-popup.tsx
          directionsUrl(lat, lng)  ←  src/lib/map.ts
          buildShareUrl(state)     ←  src/lib/share.ts
```

**The public map makes no network requests at runtime beyond map tiles.** Place JSON is bundled
at build time via static `import` statements in `studymap.config.ts`. Signing in adds real runtime
requests: Supabase Auth, plus `user-places.ts`/`user-events.ts` calls for the two private features.

---

## Key modules

### `src/lib/places.ts`

The single aggregation point for place data. Every component that needs places calls `getPlaces()` here — nothing imports the JSON directly.

```ts
getPlaces(): Place[]
filterPlaces(places, { types?, cities? }): Place[]
getCities(places, preferredOrder?): City[]
```

Region and dataset settings (initial map center, default zoom, coordinate bounds, the
city display order, and which `data/places/*.json` files get loaded) live in
`studymap.config.ts` at the repo root, the one file a fork edits to retarget StudyMap.

### `src/lib/geo.ts`

All distance math lives here. Used by `places-map.tsx` to find the five nearest places when the user enables geolocation.

```ts
haversineKm(a: LatLng, b: LatLng): number
placesByDistance(places, origin): PlaceWithDistance[]
formatDistance(km): string   // "450 m" | "3.2 km"
```

### `src/lib/map.ts`

Visual and navigation constants for the map. Keeping colours here (not inside the component) means the filter panel swatches and the Leaflet markers stay in sync automatically.

```ts
PLACE_TYPE_COLORS: Record<PlaceType, string>  // one hex per type
directionsUrl(lat, lng): string               // Google Maps deep-link
```

### `src/lib/share.ts`

Encodes the active filter state (selected types, cities, focused place ID) into a query string so filtered views are copy-pasteable.

```ts
parseMapState(search: string): MapShareState
mapStateToSearch(state): string
buildShareUrl(state): string
```

---

## Adding a place

1. Pick the right file in `data/places/<type>.json`.
2. Append a record following the shape in `src/lib/types.ts`.
3. Run `npm run dev` and open `/map` to verify the pin appears in the right spot.
4. Open a pull request — see `CONTRIBUTING.md` for the quality gate.

No code changes are needed to add a place. `getPlaces()` picks up the new entry automatically because it does a static import of the whole file.
