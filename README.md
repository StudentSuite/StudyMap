# StudyMap

A crowdsourced map of student-important places across the Mumbai Metropolitan Region (Mumbai, Thane, Navi Mumbai). Open source, zero setup, free forever.

**Live:** [studymapp.vercel.app](https://studymapp.vercel.app)  

---

## What it does

- **Places map**: find exam centres, libraries, book shops, stationery, internet cafes, train stations, and airports across the MMR. Filter by type and city.
- **Contribute**: add places or fix data via GitHub pull request. No account needed.
- **Legal**: privacy policy, terms of service, and data disclaimer for the crowdsourced dataset.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables needed; the map reads place data directly from `data/places/`.

## Data schema

Places live in `data/places/<type>.json`, one file per category:

| File | Type key |
|------|----------|
| `airport.json` | `airport` |
| `train_station.json` | `train_station` |
| `exam_centre.json` | `exam_centre` |
| `library.json` | `library` |
| `book_shop.json` | `book_shop` |
| `stationery.json` | `stationery` |
| `internet_cafe.json` | `internet_cafe` |
| `imp_locations.json` | `imp_locations` |

Each record shape (`src/lib/types.ts`):

```ts
{
  id: string;          // kebab-case, unique across all types
  name: string;
  type: PlaceType;     // one of the 8 keys above
  city: "mumbai" | "thane" | "navi_mumbai";
  lat: number;
  lng: number;
  address?: string;
  gmaps_link: string;  // must contain "maps.google.com"
  added_by: string;    // GitHub username of contributor
}
```

## How to add a place

1. Fork this repo
2. Add your place to the correct `data/places/<type>.json`
3. Verify `lat`/`lng` against Google Maps; `lat` 18–20, `lng` 72–73
4. Set `gmaps_link` to the Google Maps link
5. Open a pull request with a description of the place and a source

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

## Architecture

```
src/
  app/
    page.tsx            # homepage (hero + map preview)
    map/page.tsx        # full interactive map
    contribute/page.tsx # contribution guide
    legal/              # privacy, terms, disclaimer
    layout.tsx          # root layout (navbar, footer, theme)
  components/
    home/               # Hero, MapPreview
    map/                # PlacesMap, MapView, FilterPanel, NearMeButton
    pins/               # PinPopup
    layout/             # Navbar, Footer
  lib/
    places.ts           # getPlaces(), filterPlaces(), city loader
    geo.ts              # distance calculation, LatLng type
    types.ts            # PlaceType, City, Place interface
    map.ts              # PLACE_TYPE_COLORS, directionsUrl
    share.ts            # URL state encode/decode for shareable links
    site.ts             # site metadata, navLinks
data/
  places/               # 8 JSON files, one per place type
```

## Tech stack

- **Next.js 16** (App Router, static export)
- **Leaflet + react-leaflet** (interactive map)
- **shadcn/ui + Tailwind v4** (UI components)
- **next-themes** (dark/light mode)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Contributors

See [CONTRIBUTORS.md](CONTRIBUTORS.md).

## License

MIT. See [LICENSE](LICENSE).
