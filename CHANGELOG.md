# Changelog

All notable changes to StudyMap are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2026-07-05

### Fixed

- 2 Chennai SAT centres with completely wrong coordinates: Alphabet International School was plotted in Kashmir (33.9°N 75.1°E), KC High was plotted in Odisha (19.3°N 84.8°E). Both corrected to actual Chennai locations (Palavakkam and Navalur OMR respectively).
- 8 SAT centres across Lucknow (3), Ahmedabad (2), and Amritsar (3) that shared a single placeholder coordinate now have individual approximate coordinates derived from their address fields. Previously all pins in each city stacked on one spot.

## [2.2.0] - 2026-07-05

### Added

- `gov_offices` as a new place type (amber `#B45309`): passport offices, RTOs, post offices, district collectorates, MPSC, and municipal offices. Wired through type definitions, color tokens, CSS custom properties, Tailwind utilities, hero legend, config imports, and the data validator.
- `data/places/gov_offices.json`: 14 verified government offices — 6 in Mumbai (Passport Seva Kendra Lower Parel, Central Post Office Fort, Mumbai GPO, MPSC Office, Regional Passport Office, RTO Tardeo), 5 in Thane (Passport Seva Kendra, Head Post Office, District Collectorate, RTO, MSRTC bus stand), 3 in Navi Mumbai (Passport Seva Kendra, NMMC Head Office, RTO Navi Mumbai).

### Changed

- `imp_locations` place type renamed to `other_places` (teal `#0F766E`). All type definitions, color tokens, and config references updated. Source data file (`data/places/imp_locations.json`) archived to `data/places.archive/`; new `data/places/other_places.json` created.
- `other_places.json` trimmed to University of Mumbai Administration (Fort Campus) only; removed St Xavier's exam hall, HDFC Bank Dadar, ICICI Bank Andheri (out-of-scope entries).
- Both `CONTRIBUTING.md` and `data/CONTRIBUTING.md` updated to document the current 6 valid place types (`library`, `airport`, `sat_centre`, `foreign_lang_exam_centre`, `gov_offices`, `other_places`); removed references to the 8 retired types.

### Fixed

- Category chips now wrap to multiple lines instead of horizontal scroll, so all category filters are always visible.
- Category chip tap targets enlarged on mobile (`px-3.5 py-2`) for easier one-tap selection; desktop restores the tighter size via `sm:px-3 sm:py-1.5`.

## [2.1.0] - 2026-07-03

### Added

- `sat_centre` as a dedicated place type (purple `#7C3AED`): SAT exam venues, separate from other exam types. Carries `exam` and `valid_till` metadata. Wired through type definitions, color tokens, CSS custom properties, Tailwind utilities, and the hero legend.
- `foreign_lang_exam_centre` as a dedicated place type (cyan `#0891B2`): venues for IELTS, TOEFL, Goethe-Zertifikat, DELF, and other foreign-language examinations. Same metadata support as `sat_centre`.
- `data/places/sat_centre.json`: 7 verified SAT centres in Mumbai (migrated from `exam_centre`, type updated).
- `data/places/foreign_lang_exam_centre.json`: 2 Goethe-Institut / Max Mueller Bhavan locations (Mumbai + Pune, migrated from `exam_centre`, type updated).

### Fixed

- Validator (`scripts/validate-places.mjs`) `VALID_TYPES` updated to match the new category set; removed type data files archived to `data/places.archive/` instead of deleted.
- Form dialogs (add/edit personal event, home location, custom place) no longer close on outside click caused by extension-injected events or stray pointer events from the Leaflet map.
- Dialog, dropdown menu, and select z-indexes raised above Leaflet map layers (panes at z-400, controls at z-1000) so they render correctly over the map.

### Removed

- `exam_centre` place type: replaced by the more specific `sat_centre` and `foreign_lang_exam_centre` types. Source data file archived to `data/places.archive/`.
- `book_shop`, `stationery`, `internet_cafe`, `train_station`, `repair_shop` place types: removed for scope clarity. Source data files archived to `data/places.archive/`.

## [2.0.0] - 2026-07-01

### Added

- Responsive redesign: desktop now shows a collapsible sidebar; mobile gets a bottom sheet (Vaul) replacing the old panel. Fully reachable on small screens.
- MapTiler basemap with a colorful style in both light and dark themes, replacing the flat CARTO tiles.
- Repair shop as a ninth place category (color: red `#DC2626`), wired through the full design system (type definitions, color tokens, CSS custom properties, Tailwind utilities, hero legend).
- Map auto-fits to all loaded places on first load instead of a fixed Mumbai crop.
- CARTO basemap saturation pass for improved visual clarity before the MapTiler migration.
- Config-driven region and dataset: `studymap.config.ts` at the repo root holds `center`, `defaultZoom`, `bounds`, and a `cities` display-order registry, plus the place-data imports. Retargeting StudyMap to a new city or dataset means editing this one file.
- Data-source abstraction: `src/lib/places.ts` now reads places from `studymap.config.ts` instead of importing `data/places/*.json` directly. `src/lib/constants.ts` removed, fully superseded.
- Template-repo support for forks: "Use this template" enabled on the repo, plus `studymap.config.example.ts` and a minimal `data/places.sample/` dataset to start from.
- `SELF-HOSTING.md`: full walkthrough for running a fork - config, dataset, env vars, optional Supabase setup, deployment, keeping a fork current.
- Saved custom places and a home location for signed-in users: a private pin layer with its own search and city filter, add/edit/delete, and "Nearest to home" distance sorting. Backed by new `user_places`/`user_home` Supabase tables, RLS-scoped to each user.
- Personal calendar deadlines/events for signed-in users, overlaid on the public exam calendar. Backed by a new `user_events` Supabase table, RLS-scoped to each user.
- GitHub Discussions enabled, with a "Request a city" discussion template.
- `CONTRIBUTORS.md` and a documented recognition process (add your handle on your first merged PR).
- `good first issue` / `help wanted` labels applied to the issues that are actually ready to pick up, plus a "Good first issues" README section pointing newcomers at them.
- Vitest + React Testing Library; unit tests for `lib/geo`, `lib/share`, and `lib/places` (`npm run test:unit`).
- `docs/OFFLINE_CACHING.md`: what the PWA service worker caches and how to force a fresh load after a deploy.
- `repair_shop` documented as a valid place type in `CONTRIBUTING.md`, `data/CONTRIBUTING.md`, `README.md`, and the data validator (was a valid `PlaceType` but undocumented and rejected by `scripts/validate-places.mjs`).

### Changed

- `getCities()` now orders cities by `studymap.config.ts`'s `cities` registry, falling back to alphabetical for anything not in that list (previously always alphabetical).

### Fixed

- Popups no longer auto-close immediately after opening (#63).
- Clicking a marker no longer zooms the map.
- Clicking a different marker now closes the previously open popup.
- Popup no longer closes prematurely when a second marker is nearby (#63 edge case).
- Near Me button closes any open popup before setting user location.
- Near Me no longer auto-opens the bottom sheet or locks map interaction (#62).
- Service worker tile-cache check now targets the current MapTiler hostname instead of the stale CARTO hostname (#66).
- Cluster radius widened so unrelated markers in adjacent categories no longer render as overlapping pins (#64).
- Vaul `snapPoints` units corrected (was silently broken).
- Leaflet tile grid kept in sync after container resize.
- 17 places that shared identical coordinates are now spread to their true locations.
- Hero section: explicit space rendered between category count and the word "categories".
- Initial tile load optimized: `keepBuffer` and `updateWhenZooming` tuned for faster first paint.
- Saved-places and personal-events UI now surfaces a clear, actionable error when the backend tables haven't been set up yet, instead of silently rendering an empty state.
- Various `react-hooks` lint violations (`set-state-in-effect`, `refs`) across effect-based state resets and a vendored particles component.

### Removed

- `src/lib/constants.ts`, superseded by `studymap.config.ts`.

### Closes issues

- #29 Config-driven region (`studymap.config.ts`)
- #30 Data-source abstraction (configurable places path)
- #31 SELF-HOSTING.md
- #33 Template repo + config.example + sample dataset
- #35 good-first-issue labels + starter board + README section
- #36 CONTRIBUTORS recognition
- #37 Enable Discussions + request-a-city template
- #39 Vitest + RTL unit tests for lib/{geo,share,places}
- #60 Saved custom places + home location (signed-in, private)
- #61 Personal calendar deadlines/events (signed-in, private)
- #62 Bottom sheet / Filters fails to open on real mobile devices
- #63 Map popups auto-close immediately after opening
- #64 Tune marker clustering so unrelated categories don't render as overlapping pins
- #65 Migrate basemap provider for genuine colorful light+dark tiles
- #66 Service worker tile-cache check targets a stale hostname
- #67 Document PWA service-worker caching behaviour + how to force-refresh

## [1.2.2] - 2026-06-29

### Added

- Debounced text search input in the filter panel: filters visible pins live by place name or city substring (250 ms debounce).
- Per-category counts next to every type row in the filter panel legend - counts update whenever filters or search change.
- Nearest-first sort in the distance panel: after granting location, a "Show all" toggle expands the 5-nearest list to all visible places sorted by distance.
- Local development section in `CONTRIBUTING.md` with step-by-step setup (clone, `npm ci`, `npm run dev`) and a full worked example of adding a place end-to-end.

### Fixed

- Map double-render on load: replaced `useEffect` + `setState` URL hydration with lazy `useState` initialisers so URL state is read on the first render, not patched in after it.

### CI

- New `lint.yml` workflow: runs `npm run lint` and `tsc --noEmit` on every pull request, failing the check on any lint or type error.
- Removed `continue-on-error` from the lint step in `ci.yml` - lint failures now block the build job too.

## [1.2.1] - 2026-06-28

### Added

- Optional sign-in via Google OAuth and Supabase email/password auth. The site remains fully public - a Sign in button appears in the top-right navbar for users who want to authenticate. After sign-in, users are returned to the page they came from.

### Fixed

- Auth callbacks always redirect to `studymapp.vercel.app` regardless of which Vercel deployment URL receives the OAuth callback, preventing users from landing on the auto-assigned `studymapp-student-suite.vercel.app` domain.
- Contact email updated to `studentsuite0@gmail.com` in `CONTRIBUTING.md`, `SECURITY.md`, and issue templates.
- Canonical live URL corrected to `https://studymapp.vercel.app` in `README.md`.

## [1.2.0] - 2026-06-27

### Added

- Map marker clustering: overlapping pins now merge into pie-chart-style cluster icons (color-segmented by place type) instead of rendering as a messy pile. Click a cluster to zoom into its children.
- Exam centre metadata: places can now include `exam` (exam name) and `valid_till` (ISO date for reconfirmation) fields. Exam centres display exam type and validity date in popups.
- Verified SAT exam centres (Mumbai city only): 7 major international schools verified via web cross-check (Aditya Birla World Academy, American School of Bombay, Cathedral & John Connon, Don Bosco International, B D Somani, Anjuman Islam, Bombay Teachers' Training College). Valid through Nov 7, 2026 SAT administration.
- Goethe-Institut centres: Max Mueller Bhavan locations in Mumbai (Lower Parel, from Jul 15 2026) and Pune (Boat Club Road).
- New library in Xiamen, China (community contribution).
- Data validator (`scripts/validate-places.mjs`): checks every `data/places/*.json` entry for unique ids, valid type, valid global coordinates, a required `gmaps_link`, and no em dashes. Wired into CI as a `validate-data` job.

### Changed

- Exam centres now show individual place type markers (teardrop/pointer pins) instead of circles when isolated. Clusters use conic-gradient pie charts to visualize type distribution.
- `/docs/exam-centres` metadata updated: coverage is now Mumbai-city SAT only (not full MMR) plus Goethe centres in two cities. Added note recommending students reconfirm exact centre via College Board's official Test Center Search before registering.
- Map constants (`MAP_CENTER`, `DEFAULT_ZOOM`, `REGION_BOUNDS`) consolidated into `src/lib/constants.ts`, removing duplicate definitions from `src/lib/places.ts`.
- Restored 9 `book_shop.json` entries to their original `maps.app.goo.gl` short links and stripped trailing whitespace.

### Removed

- Old unverified IB/IGCSE exam centre entries across Thane and Navi Mumbai (replaced with high-confidence SAT centres only).

### Fixed

- `/map` crash (`ReferenceError: useRef is not defined`) in the scroll-zoom guard.

### CI

- Added GitHub Actions workflow: lint + build on every push to `main` and on PRs, alongside the place-data validator.
