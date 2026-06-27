# Contributing to StudyMap

Thanks for helping students find their way around. The most useful contribution is a real, verified place. Everything works on localhost with no setup, so you can preview your change before opening a pull request.

## Ways to contribute

- **Add a public place** (library, exam centre, book shop, stationery, and so on)
- **Fix incorrect data** (wrong coordinates, outdated name, broken link)
- **Fix code or docs**

## Quality gate for places

Public places live in the repo as JSON and must be trustworthy. Before a place is merged it must clear this gate, with proof shown in the PR:

- A **source or citation** showing the place is real and reputable
- A **Google Maps rating of 4.0 or higher**
- **50 or more Google Maps reviews**
- A **date you verified** the place and its coordinates

Proof goes in the pull request, never in the committed JSON.

## The place record

Each place is one object inside `data/places/<type>.json`. Valid types: `book_shop`, `library`, `exam_centre`, `imp_locations`, `stationery`, `internet_cafe`, `airport`, `train_station`.

```json
{
  "id": "mum-library-07",
  "name": "City Library, Dadar branch",
  "type": "library",
  "city": "mumbai",
  "lat": 19.0176,
  "lng": 72.8562,
  "address": "Optional, short and human-readable",
  "gmaps_link": "https://maps.app.goo.gl/...",
  "added_by": "your-github-handle"
}
```

- `city` is a lowercase, underscore-separated slug (e.g. `mumbai`, `navi_mumbai`, `jakarta`). Any city worldwide is welcome — StudyMap is not limited to the Mumbai Metropolitan Region.
- `id` format: `<city-prefix>-<type>-<number>`, unique within the file
- Coordinates: real-world `lat`/`lng` for the place, matched to its `city`
- Do not add rating, review count, or verified date to the JSON. Those go in the PR.
- `exam` and `valid_till` are optional, `exam_centre`-only fields:
  - `exam`: the exam this centre serves, e.g. `"SAT"`, `"Goethe-Zertifikat (A1-C2)"`
  - `valid_till`: ISO date (`YYYY-MM-DD`) the entry should be reconfirmed by, e.g. the last exam administration the centre is verified for. Always reconfirm your exact centre with the exam board before relying on this field; centres change between administrations.

## Commit message format

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <short description>`.

| Type | When to use |
|------|-------------|
| `feat` | New feature or place |
| `fix` | Bug fix or incorrect data |
| `chore` | Maintenance, deps, config |
| `refactor` | Code restructure, no behavior change |
| `docs` | Docs only |
| `style` | Formatting, whitespace |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `revert` | Reverts a previous commit |

Optional scope in parens: `feat(calendar): add today label`. One logical change per commit.

## House rules

- No em dashes in any copy
- Run `npm run dev` and verify your change on localhost before opening a PR
- Questions: open an issue or email [dhawansanay@gmail.com](mailto:dhawansanay@gmail.com)
