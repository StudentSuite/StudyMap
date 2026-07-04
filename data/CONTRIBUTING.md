# Adding places to StudyMap

Places live in `data/places/<type>.json`, one file per place type, one JSON object per place.

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
- `id`: `<city-prefix>-<type>-<number>`. Prefixes: `mum`, `thane`, `navi`. Increment from the highest existing number in the file.
- `city`: one of: `mumbai`, `thane`, `navi_mumbai`
- `type`: must match the filename exactly
- `lat`/`lng`: from Google Maps (right-click pin, "What's here?"). Range: lat 18-20, lng 72-73.
- `address`: optional, short, human-readable
- `gmaps_link`: Google Maps share link (Share -> Copy link)
- Do not add rating, review count, or verified date to the JSON. Those go in the PR.

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
