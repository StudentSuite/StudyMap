# StudyMap

A crowdsourced map of student-important places across the Mumbai Metropolitan Region (Mumbai, Thane, Navi Mumbai), with a past-paper catalogue and a student-benefits guide. Open source and self-hostable.

> This README is an early stub. A fuller version is on the way.

## What it does

- **Places map:** find exam centres, libraries, book depots, passport offices, internet cafes, community study spots, train stations, and airports across the MMR. Filter by type and city.
- **Resources:** curated links to past papers and official portals by board (IB, IGCSE, NEET, JEE, UPSC, SAT). The site never hosts files; it links out.
- **Local papers:** keep your own question papers and syllabi in a local `papers/` folder and browse them offline on localhost.
- **Benefits:** guides on claiming student perks, getting software free or discounted, travelling solo, and applying for a passport.
- **Personal pins (optional):** sign in with Google to save private places (home, school, coaching) visible only to you.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The map, resources, papers, and benefits all work with no setup. Sign-in and personal pins are optional and only activate when Supabase environment variables are present (see `.env.example`).

## Tech

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Leaflet (OpenStreetMap) + Supabase (auth and private pins only).

## Contributing

See `CONTRIBUTING.md`. Public places are submitted through GitHub with a citation and a quality check.

## License

See `LICENSE`.
