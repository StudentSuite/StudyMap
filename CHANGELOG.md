# Changelog

All notable changes to StudyMap are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
