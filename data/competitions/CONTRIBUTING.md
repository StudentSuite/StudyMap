# Adding competitions to StudyMap

Competitions live in `data/competitions/<category>.json`, one file per category, one JSON
object per competition.

This file is the single source of truth for the competition-record schema - `README.md`,
`CONTRIBUTING.md`, and `ARCHITECTURE.md` link here instead of repeating it. The shape
below is also machine-enforced by [`competitions.schema.json`](../competitions.schema.json), which
`npm run validate` checks every record against.

## Pick the right file

| File | What goes here |
|------|---------------|
| `stem.json` | General science, engineering and science-fair competitions |
| `mathematics.json` | Mathematics olympiads and tournaments |
| `coding.json` | Competitive programming, cybersecurity and app-building competitions |
| `essay_writing.json` | Argumentative, analytical and journalistic essay competitions |
| `creative_writing.json` | Poetry, fiction and other creative writing competitions |
| `arts_design.json` | Visual art, portfolio and design competitions |
| `film_video.json` | Film and video competitions |
| `business.json` | Entrepreneurship, pitch and business case competitions |
| `finance.json` | Investing, personal finance and economics competitions |
| `humanities.json` | Language, linguistics and other humanities competitions not covered above |
| `history.json` | History research and quiz competitions |
| `debate_mun.json` | Debate, Model UN and other academic tournament competitions |
| `research.json` | Independent research competitions |
| `scholarship.json` | Scholarship programs judged on a body of work rather than a single entry |
| `interdisciplinary.json` | Competitions that clearly span two or more categories, e.g. robotics |

## Record format

```json
{
  "id": "breakthrough-junior-challenge",
  "name": "Breakthrough Junior Challenge",
  "organizer": "Breakthrough Prize Foundation",
  "organizer_url": "https://breakthroughjuniorchallenge.org",
  "category": "stem",
  "subjects": ["physics", "science communication"],
  "description": "One to three sentences, written by us.",
  "format": "online",
  "age_min": 13,
  "age_max": 18,
  "participation": "individual",
  "region": "international",
  "fee": { "amount": 0, "currency": "USD" },
  "prize": "USD 250,000 scholarship plus a lab grant",
  "official_url": "https://breakthroughjuniorchallenge.org",
  "cycle_year": 2026,
  "dates": [
    {
      "label": "Submission deadline",
      "date": "2026-06-25",
      "type": "deadline",
      "timezone": "UTC-4",
      "estimated": false,
      "source_url": "https://breakthroughjuniorchallenge.org/rules"
    }
  ],
  "country_tracks": [
    {
      "country": "IN",
      "official_url": "https://www.iarcs.org.in/",
      "stages": [
        { "name": "ZIO", "date": "2026-11-15", "estimated": false, "source_url": "https://www.iarcs.org.in/" }
      ]
    }
  ],
  "added_by": "your-github-handle",
  "verified": { "by": "your-github-handle", "on": "2026-09-05" },
  "valid_till": "2027-09-05"
}
```

**Fields:**
- `id`: kebab-case slug, unique across every file in `data/competitions/`. Base it on the
  competition's name, e.g. `regeneron-isef`, `harvard-model-united-nations`.
- `category`: must match the filename exactly.
- `subjects`: free-form tags, lowercase, e.g. `["biology"]` or `["debate", "public speaking"]`.
- `description`: one to three plain sentences, written fresh by you. See
  [Sourcing rules](#sourcing-rules) below, this is a hard requirement.
- `format`: `online`, `in_person`, or `hybrid`.
- `age_min` / `age_max`: the eligible age range. Use the organizer's own published range.
- `participation`: `individual`, `team`, or `individual_or_team`.
- `region`: `"international"` if open worldwide with no single home country, otherwise the
  ISO-3166 alpha-2 code of the competition's home country (e.g. `"US"`, `"GB"`).
- `fee`: entry fee as `{ "amount": number, "currency": "XXX" }`. Use `0` if free to enter.
- `official_url` / `organizer_url`: the competition's own site and the organizing body's
  site. Often the same URL.
- `cycle_year`: the competition year the `dates` below describe.
- `dates`: every date a student needs, each with:
  - `type`: one of `registration_open`, `registration_close`, `deadline`, `round`,
    `results`, `ceremony`.
  - `timezone`: the UTC offset the date/time was read in, e.g. `"UTC-4"`.
  - `estimated`: `true` if this date is a best guess following the typical cycle rather
    than a confirmed date for the current cycle. Be honest here, a wrong "confirmed" date
    is worse than an honest estimate.
  - `source_url`: the exact page you read the date from. **Must resolve** - check it
    loads before you open a PR. Prefer the competition's own official site over a
    third-party catalog.
- `country_tracks`: optional. Only add this when a real national qualifying pathway
  exists, for one of `IN US GB CA AU SG DE FR CN JP KR BR ZA`. Do not fabricate a
  pathway that doesn't exist. Each stage needs its own `source_url` too.
- `added_by`: your GitHub username.
- `verified` / `valid_till`: see [Verification](#verification) below.

## Sourcing rules

Take **facts only**: names, organizers, dates, fees, eligibility, age ranges, prizes,
official URLs, and real country qualifying pathways. Facts are not copyrightable.

**Write every `description` fresh.** Do not copy prose from doq.world, Wikipedia, or any
other catalog or the competition's own marketing copy. One to three sentences, plain, no
marketing register ("prestigious", "world-class", and similar are out). A lift is visible
in git history forever on a public repo, and it isn't necessary, the facts are enough.

Do not import anyone else's prestige or selectivity rating. StudyMap does not make that
editorial call.

## Verification

Competitions can carry an optional `verified` block recording that a contributor
re-checked the record:

```json
"verified": {
  "by": "your-github-handle",
  "on": "2026-08-14"
}
```

- `by` is the verifier's GitHub username; `on` is the ISO date (YYYY-MM-DD) they checked it.
- A verification stays valid for **6 months**. Dates and fees change fast enough, and a
  countdown timer showing a stale date is worse than showing none, so competitions default
  to a shorter window than places.
- After the window, the record should be re-verified (update `verified.on` and any dates
  that changed) or the `verified` block removed.
- `valid_till` records the date the whole record should be reconfirmed by, independent of
  the `verified` block above; the freshness cron uses it to flag records that need a look.
- `npm run validate` fails on a malformed `verified` block (missing or empty `by`, a
  non-date or impossible `on`, or extra keys), on a `source_url` that doesn't look like a
  URL, and on any string field containing an em dash.

## Quality gate (must pass before merge)

Include in your pull request description:

- [ ] Source or citation showing the competition is real
- [ ] Confirmation every `source_url` resolves (you opened each one)
- [ ] Confirmation the `description` is your own writing, not copied from any source
- [ ] Date you verified the fees, dates and eligibility

## Commit format

```
feat(data): add competition - Regeneron ISEF
```

One competition per commit is fine. Multiple competitions of the same category in one
commit is also fine.

## Adding a new category (maintainers)

The list of valid categories lives in more than one place. Adding a category (e.g. a new
`<category>.json`) also requires:

1. `src/lib/types.ts` - extend the competition category union (labels/colors derive from it)
2. `data/competitions.schema.json` - extend the `category` enum
3. `.github/ISSUE_TEMPLATE/add-competition.yml` - extend the dropdown
