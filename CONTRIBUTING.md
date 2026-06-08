# Contributing to StudyMap

Thanks for helping students find their way around. The most useful thing you can
add is a real, verified place. Everything here works on localhost with no setup,
so you can see your change before you open a pull request.

## Ways to contribute

- **Add a public place** (library, exam centre, book depot, and so on).
- **Add or fix a benefit guide** (free software, travel, paperwork, perks).
- **Add a resource link** (a board's past papers or registration portal).
- **Fix code or docs.**

The fastest path for places and benefits is the issue forms under
**New issue**: they ask for everything a reviewer needs. A maintainer turns an
accepted issue into a pull request, or you can open the PR yourself.

## The quality gate for public places

Public places live in the repo as JSON, so they have to be trustworthy. Before a
place is merged it must clear this gate, with the proof shown in the PR:

- A **source or citation** that shows the place is real and reputable.
- A **Google Maps rating of 4.0 or higher.**
- **50 or more Google Maps reviews.**
- A **date you verified** the place and its coordinates.

The proof lives in the pull request, never in the committed data.

## The place record

Each place is one object inside `data/places/<type>.json` (one file per type, so
adding a city never touches existing files). The committed record stops at
`gmaps_link` and `added_by`:

```json
{
  "id": "mum-library-07",
  "name": "City Library, Dadar branch",
  "type": "library",
  "city": "mumbai",
  "lat": 19.0176,
  "lng": 72.8562,
  "address": "Optional, short and human readable",
  "gmaps_link": "https://maps.app.goo.gl/...",
  "added_by": "your-handle"
}
```

- `type` is one of: `book_shop`, `library`, `exam_centre`, `imp_locations`,
  `stationery`, `internet_cafe`, `airport`, `train_station`.
- `city` is one of: `mumbai`, `thane`, `navi_mumbai`.
- `id` is `<city-prefix>-<type>-<number>` and must be unique within its file.
- Do **not** add rating, review count, citation, or verified date to the JSON.
  Those go in the PR.

## Resources and papers

- Resources are links only. Add an entry to `data/resources/<board>.json`. The
  site never hosts a file; `url` always points to an official source.
- The app never ships past papers. The `papers/` folder is local and ignored by
  git, so people keep their own files there for offline use.

## Benefit guides

Benefit guides are MDX files in `content/benefits/`. Add a file with frontmatter
(`title`, `summary`, `order`) and keep the steps tied to official sources.

## House rules

- Conventional commit messages, one logical change per commit.
- No em dashes in any copy.
- Run `npm run dev` and check your change on localhost before opening a PR.
