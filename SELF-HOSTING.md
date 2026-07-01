# Self-hosting StudyMap

Run StudyMap for your own city. Everything below works from a fork, no coding required beyond
editing one config file and your place data.

## What you get out of the box

- The interactive map, filters, search, and calendar for whatever `data/places/*.json` you provide.
- Two optional, signed-in-only features (saved places, personal calendar events) if you set up your
  own Supabase project. Skip that section entirely and the app still works, just without those.

## 1. Get the code

Click "Use this template" at the top of [StudentSuite/StudyMap](https://github.com/StudentSuite/StudyMap)
to create your own copy, then clone it:

```bash
git clone https://github.com/<your-account>/<your-fork>.git
cd <your-fork>
npm install
```

## 2. Set your region and dataset

Everything region- and data-specific lives in one file: `studymap.config.ts` at the repo root.

```bash
cp studymap.config.example.ts studymap.config.ts
```

Edit it:

- `center`: `[lat, lng]` for the initial map view
- `defaultZoom`: initial zoom level (11-13 works well for a metro area)
- `bounds`: rough coordinate box around your region, used for data validation and map fitting
- `cities`: display order for the city filter (any city present in your data but missing here
  still shows, just sorted alphabetically after)
- `places`: swap the sample imports for your own `data/places/*.json` files

The dataset itself follows the schema in [`data/CONTRIBUTING.md`](data/CONTRIBUTING.md): one JSON
file per place type, one object per place, with `id`, `name`, `type`, `city`, `lat`, `lng`,
`gmaps_link`, and `added_by`. `data/places.sample/` has two minimal example entries if you want to
start from a clean skeleton instead of the Mumbai dataset that ships with the template.

Validate as you go:

```bash
npm run validate
```

## 3. Environment variables

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_MAPTILER_KEY` is required for the map basemap. Free tier, no credit card, at
  [cloud.maptiler.com](https://cloud.maptiler.com/account/keys/).
- The Supabase variables are optional. Leave them blank and the map, filters, and calendar all
  work; you just won't get sign-in or the two private features below. See step 5 to fill them in.

## 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000/map](http://localhost:3000/map) and confirm your places show up in
the right spot.

## 5. Optional: sign-in, saved places, and personal calendar events

These three features (`src/app/login`, saved custom places, personal calendar events) need a
Supabase project:

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy its URL and anon key into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. In the Supabase SQL editor, run every file in `supabase/migrations/`, in filename order. Each
   one creates its tables with row-level security already scoped to `auth.uid()`, so users can
   only ever read or write their own rows.
4. Enable whichever auth providers you want (email, Google, etc.) under Authentication > Providers.

Skip this whole section if you only want the public map and calendar.

## 6. Deploy

Deploy like any standard Next.js app, for example on Vercel:

```bash
npx vercel
```

or import the repo at [vercel.com/new](https://vercel.com/new) and set the same environment
variables from step 3 in the project settings.

**Static export (`output: "export"`) is not supported.** Sign-in needs a live server: the OAuth
callback route exchanges a code for a session server-side, and middleware refreshes that session
on every request. Both are incompatible with a static build. Deploy to a normal server/edge
runtime instead, that's the default for Vercel and most other Next.js hosts.

## Keeping your fork current

StudyMap doesn't push updates to forks automatically. To pull in upstream fixes, add the original
repo as a remote and merge from it:

```bash
git remote add upstream https://github.com/StudentSuite/StudyMap.git
git fetch upstream
git merge upstream/main
```

Your `studymap.config.ts`, `.env.local`, and `data/places/*.json` are yours, upstream changes to
shared code (map, calendar, components) merge in without touching them, unless you've also edited
those files.
