# Changelog

All notable changes to StudyMap are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-06-27

### Added

- Map marker clustering: overlapping pins now merge into pie-chart-style cluster icons (color-segmented by place type) instead of rendering as a messy pile. Click a cluster to zoom into its children.
- Exam centre metadata: places can now include `exam` (exam name) and `valid_till` (ISO date for reconfirmation) fields. Exam centres display exam type and validity date in popups.
- Verified SAT exam centres (Mumbai city only): 7 major international schools verified via web cross-check (Aditya Birla World Academy, American School of Bombay, Cathedral & John Connon, Don Bosco International, B D Somani, Anjuman Islam, Bombay Teachers' Training College). Valid through Nov 7, 2026 SAT administration.
- Goethe-Institut centres: Max Mueller Bhavan locations in Mumbai (Lower Parel, from Jul 15 2026) and Pune (Boat Club Road).

### Changed

- Exam centres now show individual place type markers (teardrop/pointer pins) instead of circles when isolated. Clusters use conic-gradient pie charts to visualize type distribution.
- `/docs/exam-centres` metadata updated: coverage is now Mumbai-city SAT only (not full MMR) plus Goethe centres in two cities. Added note recommending students reconfirm exact centre via College Board's official Test Center Search before registering.

### Removed

- Old unverified IB/IGCSE exam centre entries across Thane and Navi Mumbai (replaced with high-confidence SAT centres only).

## [1.1.0] - 2026-06-26

### Added

- Map filter panel: city filter is now a dynamic dropdown built from the dataset
  instead of a fixed Mumbai/Thane/Navi Mumbai checkbox list. Selecting a city
  flies the map to that city's bounds.

### Changed

- StudyMap is now international in scope. `CONTRIBUTING.md` no longer
  restricts `city` or coordinates to the Mumbai Metropolitan Region; any real,
  verified place worldwide is welcome. Map page metadata updated to match.
- Re-curated `train_station.json` back to the 5 major stations (CSMT, Dadar,
  Andheri, Thane, Vashi) after a later contribution had reintroduced the full
  Western/Central/Harbour line list, which diluted the curated set.
- Navbar `z-index` raised so it always renders above the map's filter panel
  and markers on the `/map` page.
- Mobile hamburger nav drawer `z-index` raised above the map UI so it's no
  longer covered when opened on small screens.

## [1.0.2] - 2026-06-26

### Added

- **Libraries (12 new):** Asiatic Society of Mumbai Library and Mumbai University Library (Fort); Andheri, Mulund, and Kurla municipal branches; Indian Library and Marathi Granth Sangrahalaya (Thane West); Dombivali Municipal Library; Ideal Study Library (Nerul, 4.6 rating); NMMC Central Library (Sanpada); Readnjoy Library (Kharghar); Panvel Municipal Library. Cities covered: Mumbai, Thane, Navi Mumbai.
- **Book shops (12 new):** Strand Book Stall and Kitab Khana (Fort); Crossword branches at Kemps Corner, Juhu, and Malad; Crossword Viviana Mall and Variety Book House (Thane); Book Corner (Dombivali); Crossword Vashi; New Light Book House (Nerul); Popular Book Depot (Kharghar); Panvel Book Centre.
- **Exam centres (11 new):** Elphinstone College (Fort), Ramnarain Ruia College (Matunga), Mithibai College (Vile Parle), Wilson College (Chowpatty), K.C. College (Churchgate); VPM's Bandodkar College, Bedekar College, Dnyanasadhana College (Thane); SIES College and Apeejay School (Nerul); Ryan International School (Kharghar).
- **Internet cafes (11 new):** Bytes (Andheri East), Speedway (Borivali), Digital Zone (Ghatkopar), Net Planet (Kurla), iCafe (Malad); Netzone, GameStation, Connect Cyber Cafe (Thane/Dombivali); Speed Net (Kharghar), Cyber Hub (Panvel), Cyber World (Belapur).
- **Important locations (11 new):** University of Mumbai administration and Mumbai GPO (Fort); MPSC office and Regional Passport Office (South Mumbai); RTO Tardeo; Thane District Collectorate, RTO Thane, MSRTC Thane Bus Stand; Passport Seva Kendra, NMMC Head Office, and RTO (Navi Mumbai).

Total places added this release: 57.

## [1.0.1] - 2026-06-12

### Changed

- Calendar: events this month now appear above the calendar grid.
- Calendar: today's date circle is labelled "today" below the number.
- Navbar: changed from `sticky` to `fixed` so it stays visible while scrolling on the map page.

## [1.0.0] - 2026-06-11

First public release.

### Added

- Exam calendar page (`/calendar`): next 4 international SAT administrations,
  IB Nov 2026 + May 2027 sessions, Cambridge IGCSE June 2026 + Oct/Nov 2026
  series: exam windows and result dates, each cited to the official board.
- Student docs: GitHub Student Developer Pack guide
  (`/docs/github-student-pack`) with official citations.
- Google-Maps-style scroll behavior on the map: plain scroll scrolls the page,
  Ctrl/Cmd + scroll zooms the map, with a hint overlay.
- Theme-aware Leaflet UI: popups, tooltips, zoom controls, and attribution now
  follow the app's light/dark theme.
- Live place count in the hero, computed from the dataset.
- Mobile filter panel redesigned as a bottom sheet with backdrop and close
  button.

### Changed

- Curated the places dataset (80 → 53): removed helipads, seaplane terminals,
  hospitals, closed businesses, mislabeled entries, and low-value small shops;
  kept the 5 most important railway stations.
- Map popups restyled to match the design system; popup links are white on an
  amber CTA with WCAG-compliant contrast in both themes.
- README rewritten for the open-source launch (badges, features, roadmap,
  changelog links).

### Removed

- Stale design-system HTML from the repo root (moved to `docs/`).
- Stray local files that should never have been tracked.

### Security

- Removed accidentally committed SSH key files from the working tree.

## [0.1.0] - 2026-06-08

Internal milestone: Places-only scope.

### Changed

- Narrowed scope to map + places + contribute + legal. Removed resources,
  student-docs, contact, and auth features (decision 2026-06-11; superseded
  for student-docs by 1.0.0, which reintroduces a single curated guide).

[1.1.0]: https://github.com/StudentSuite/StudyMap/compare/v1.0.1...v1.1.0
[1.0.0]: https://github.com/StudentSuite/StudyMap/releases/tag/v1.0.0
