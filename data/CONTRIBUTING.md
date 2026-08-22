# Adding places to StudyMap

Places live in `data/places/<type>.json`, one file per place type, one JSON object per place.

This file is the single source of truth for the place-record schema - `README.md`,
`CONTRIBUTING.md`, and `ARCHITECTURE.md` link here instead of repeating it. The shape
below is also machine-enforced by [`places.schema.json`](places.schema.json), which
`npm run validate` checks every record against.

## Pick the right file

| File | What goes here |
|------|---------------|
| `sat_centre.json` | SAT exam venues. Include `exam: "SAT"` and `valid_till` |
| `foreign_lang_exam_centre.json` | IELTS, TOEFL, Goethe, DELF, and other foreign-language exam venues. Include `exam` name and `valid_till` where known |
| `library.json` | Public and institutional libraries |
| `gov_offices.json` | Passport offices, RTOs, embassies, post offices, district offices, and other government/civic offices |
| `airport.json` | Airports |
| `other_places.json` | Miscellaneous student-relevant places that don't fit another category |

## Record format

```json
{
  "id": "mum-library-07",
  "name": "City Library, Dadar branch",
  "type": "library",
  "city": "mumbai",
  "lat": 19.0176,
  "lng": 72.8562,
  "address": "Gate 2, Gokhale Road, Dadar West",
  "gmaps_link": "https://maps.app.goo.gl/xxxx",
  "added_by": "your-github-handle"
}
```

**Fields:**
- `id`: `<city-prefix>-<type>-<number>`. Prefix is a short slug for the city (e.g. `mum`, `thane`, `navi`, `ldn`, `jkt`). Increment from the highest existing number in the file for that prefix.
- `city`: lowercase, underscore-separated slug (e.g. `mumbai`, `navi_mumbai`, `jakarta`). Any city worldwide is welcome, not just Mumbai/Thane/Navi Mumbai.
- `type`: must match the filename exactly
- `lat`/`lng`: from Google Maps (right-click pin, "What's here?"). Range: lat 18-20, lng 72-73.
- `address`: optional, short, human-readable
- `gmaps_link`: Google Maps share link (Share -> Copy link)
- Do not add rating, review count, or verified date to the JSON. Those go in the PR.
- `verified` is the one exception (#126): a maintainer may add it after a
  contributor re-checks a place. See [Verification](#verification) below.

## Verification

Places can carry an optional `verified` block recording that a contributor
re-checked the place:

```json
"verified": {
  "by": "your-github-handle",
  "on": "2026-08-14"
}
```

- `by` is the verifier's GitHub username; `on` is the ISO date (YYYY-MM-DD)
  they checked it.
- A verification stays valid for **12 months** — or **6 months** for exam
  centres (`sat_centre` / `foreign_lang_exam_centre`), where a stale address
  is worse than no address. After the window, the place should be verified
  again or the block removed.
- Verified places show a small badge on the map and in lists; unverified
  places look exactly as before.
- `npm run validate` fails on a malformed `verified` block (missing or empty
  `by`, a non-date or impossible `on`, or extra keys).

## Quality gate (must pass before merge)

Include in your pull request description:

- [ ] Source or citation showing the place is real
- [ ] Google Maps rating 4.0 or higher
- [ ] 50+ Google Maps reviews
- [ ] Date you verified the place and coordinates

## Commit format

```
feat(data): add library - City Library Dadar, Mumbai
```

One place per commit is fine. Multiple places of the same type in one commit is also fine.

## Tips

- Run `npm run dev` and verify the pin lands on the correct spot on the map before opening a PR.
- If adding many places at once, batch by type (one commit per file).

## Adding a new place type (maintainers)

The list of valid place types lives in more than one place. Adding a type #7
(e.g. a new `<type>.json`) also requires:

1. `src/lib/types.ts` — extend `PLACE_TYPES` (labels/colors derive from it)
2. `data/places.schema.json` — extend the `type` enum
3. `.github/ISSUE_TEMPLATE/add-place.yml` — extend the dropdown
4. A DB migration for the `user_places.type` CHECK constraint
   (`supabase/migrations/20260822_harden_user_places.sql`) so saved places of
   the new type pass validation
