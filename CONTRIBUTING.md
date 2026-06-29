# Contributing to StudyMap

Thanks for helping students find their way around. The most useful contribution is a real, verified place. Everything works on localhost with no setup, so you can preview your change before opening a pull request.

## Ways to contribute

- **Add a public place** (library, exam centre, book shop, stationery, and so on)
- **Fix incorrect data** (wrong coordinates, outdated name, broken link)
- **Fix code or docs**

## Local development

### 1. Clone and install

```bash
git clone https://github.com/StudentSuite/StudyMap.git
cd StudyMap
npm ci
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

The only required variables are the Supabase credentials (for auth). If you are only adding place data, you can leave them blank - the map still loads without auth.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The map is at [http://localhost:3000/map](http://localhost:3000/map).

### Worked example: adding a library in Thane

#### Step 1 - verify the place meets the quality gate

Search the place on Google Maps. Confirm:

- Rating is 4.0 or higher
- It has 50 or more reviews
- It is real and currently operating

Note down the rating, review count, and date - these go in your PR, not the JSON.

#### Step 2 - get the coordinates

Click the place on Google Maps. The URL contains the coordinates, e.g. `@19.2183,72.9781`. Alternatively, right-click the entrance pin and copy the lat/lng.

#### Step 3 - find the next available ID

```bash
node -e "const d = require('./data/places/library.json'); const ids = d.map(e=>e.id).filter(id=>id.startsWith('thn')); console.log(ids.sort().at(-1));"
```

If the last Thane library ID is `thn-library-03`, use `thn-library-04`.

#### Step 4 - add the entry

Open `data/places/library.json` and append before the closing `]`:

```json
{
  "id": "thn-library-04",
  "name": "Thane Municipal Library, Naupada",
  "type": "library",
  "city": "thane",
  "lat": 19.2183,
  "lng": 72.9781,
  "address": "Naupada, Thane West",
  "gmaps_link": "https://maps.google.com/?q=19.2183,72.9781",
  "added_by": "your-github-handle"
}
```

#### Step 5 - validate

```bash
node -e "const d = require('./data/places/library.json'); console.log('Total:', d.length); const ids = d.map(e=>e.id); console.log('Dups:', ids.filter((id,i)=>ids.indexOf(id)!==i).length||'none');"
```

#### Step 6 - confirm the pin appears

The dev server hot-reloads. Refresh [http://localhost:3000/map](http://localhost:3000/map) and check that the new pin appears at the right location.

#### Step 7 - open a PR

Commit with `feat(data): add Thane Municipal Library, Naupada` and open a pull request. Include the Google Maps rating, review count, and the date you verified the place in the PR description.

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
- Questions: open an issue or email [studentsuite0@gmail.com](mailto:studentsuite0@gmail.com)
