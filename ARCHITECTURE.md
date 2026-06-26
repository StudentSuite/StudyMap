# Architecture

StudyMap is a Next.js 16 (App Router) static site. There is no database, no auth, and no server-side logic. All place data ships as JSON in the repo. This document is a map for new contributors.

---

## Folder layout

```
studymap/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── add-place.yml         # issue form: suggest a new place
│   │   ├── bug_report.yml        # issue form: file a bug
│   │   ├── feature_request.yml   # issue form: request a feature
│   │   └── config.yml            # disables blank issues, adds contact links
│   └── pull_request_template.md
├── data/
│   ├── CONTRIBUTING.md           # data-specific contribution rules
│   └── places/                   # 8 JSON files, one per place type
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
├── ARCHITECTURE.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── components.json               # shadcn/ui component config
├── eslint.config.mjs
├── next.config.js
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

### `data/places/`

Eight JSON files, one per place category. Each file is a flat array of place objects. This is the only place place data lives — nothing is duplicated elsewhere.

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

Record shape (defined in `src/lib/types.ts`):

```ts
{
  id: string;        // kebab-case, unique across all types
  name: string;
  type: PlaceType;
  city: "mumbai" | "thane" | "navi_mumbai";
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
│   ├── places-map.tsx      # top-level map container (filtering, URL state, geolocation)
│   ├── map-view.tsx        # Leaflet map (markers, tiles, scroll guard, user dot)
│   ├── filter-panel.tsx    # city + type checkboxes, result count, reset
│   └── near-me-button.tsx  # triggers browser geolocation
├── pins/
│   └── pin-popup.tsx       # popup on marker click (directions, share, added_by)
├── layout/
│   ├── navbar.tsx
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

### `src/lib/`

Pure TypeScript modules. No JSX, no React imports. Each file has a single responsibility.

| File | What it does |
|------|-------------|
| `types.ts` | `Place`, `PlaceType`, `City` types; label maps |
| `places.ts` | Imports all 8 JSON files; exports `getPlaces()` and `filterPlaces()` |
| `geo.ts` | Haversine distance, `placesByDistance()`, `formatDistance()` |
| `map.ts` | `PLACE_TYPE_COLORS` (color-blind-safe palette); `directionsUrl()` |
| `share.ts` | URL state encode/decode for shareable filtered map links |
| `site.ts` | Site name, tagline, repo URL, nav link list |
| `exam-dates.ts` | `EXAM_EVENTS` array with SAT/IB/IGCSE session data |
| `fonts.ts` | next/font setup (Inter, Space Grotesk, JetBrains Mono) |
| `utils.ts` | `cn()` — clsx + tailwind-merge helper |

---

## Data flow

```
data/places/*.json
       │
       ▼
src/lib/places.ts          getPlaces() merges all 8 files into one Place[]
       │                   filterPlaces() narrows by type and/or city
       ▼
src/components/map/places-map.tsx
       │  reads URL params via share.ts → parseMapState()
       │  calls filterPlaces() on every filter change
       │  passes filtered Place[] down to MapView
       │
       ├──▶ src/components/map/filter-panel.tsx   (type + city checkboxes)
       ├──▶ src/components/map/near-me-button.tsx  (geolocation → placesByDistance())
       │
       ▼
src/components/map/map-view.tsx
       │  renders one Leaflet CircleMarker per place, coloured by PLACE_TYPE_COLORS
       │  on marker click: opens PinPopup
       │
       ▼
src/components/pins/pin-popup.tsx
          directionsUrl(lat, lng)  ←  src/lib/map.ts
          buildShareUrl(state)     ←  src/lib/share.ts
```

**No network requests at runtime.** The JSON is bundled at build time via static `import` statements in `places.ts`. The Leaflet tile layer (OpenStreetMap) is the only external request when the map is open.

---

## Key modules

### `src/lib/places.ts`

The single aggregation point for place data. Every component that needs places calls `getPlaces()` here — nothing imports the JSON directly.

```ts
getPlaces(): Place[]
filterPlaces(places, { types?, cities? }): Place[]
MMR_CENTER   // [lat, lng] for the initial map view
MMR_DEFAULT_ZOOM
```

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
